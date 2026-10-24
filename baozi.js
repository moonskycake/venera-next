class Baozi extends ComicSource {
  // 此漫画源的名称
  name = "包子漫画";

  // 唯一标识符
  key = "baozi";

  version = "1.1.7-debug1";

  minAppVersion = "1.0.0";

  // 更新链接
  url = "https://cdn.jsdelivr.net/gh/moonskycake/venera-next@main/baozi.js";

  settings = {
    language: {
      title: "简繁切换",
      type: "select",
      options: [
        { value: "cn", text: "简体" },
        { value: "tw", text: "繁體" },
      ],
      default: "cn",
    },
    domains: {
      title: "主域名",
      type: "select",
      options: [
        { value: "twmanga.com" },
        { value: "webmota.com" },
        { value: "kukuc.co" },
        { value: "dinnerku.com" },
      ],
      default: "twmanga.com",
    },
    cdn_domains: {
      title: "图片资源站域名",
      type: "select",
      options: [
        { value: "as-rsa1-usla.baozicdn.com" },
        { value: "ascn-a3.bzcdn.net" },
        { value: "asgb-a3.bzcdn.net" },
        { value: "as.baozimh.com" },
        { value: "s1.baozicdn.com" },
        { value: "", text: "默认" },
      ],
      default: "",
    },
    image_quality: {
      title: "图片质量",
      type: "select",
      options: [
        {
          value: "/w640",
          text: "640p"
        },
        {
          value: "",
          text: "原图"
        }
      ],
      default: "/w640",
    },
  };

  // 依次尝试的域名：bzmgcn.com / baozimhcn.com 现在返回 Cloudflare / gatekeeper JS 挑战(403)，
  // 普通 HTTP 客户端过不去，所以不再放进候选列表。
  static domainCandidates = ["twmanga.com", "webmota.com", "kukuc.co", "dinnerku.com"];

  // 动态生成完整域名
  get lang() {
    return this.loadSetting("language") || this.settings.language.default;
  }
  get domain() {
    return this._workingDomain || this.loadSetting("domains") || this.settings.domains.default;
  }
  get baseUrl() {
    return `https://${this.lang}.${this.domain}`;
  }

  // 当前可用域名优先，其余候选依次兜底
  get domainOrder() {
    let list = [];
    let add = (d) => {
      if (d && list.indexOf(d) < 0) list.push(d);
    };
    add(this._workingDomain);
    add(this.loadSetting("domains") || this.settings.domains.default);
    for (let d of Baozi.domainCandidates) add(d);
    return list;
  }

  // 包子中国区域名会返回 {"error":"challenge_required"} 或 400 bad_request，
  // 读图接口也只有部分域名开放，所以统一在这里做换域名重试。
  async request(path) {
    let last = "";
    let tried = 0;
    for (let domain of this.domainOrder) {
      if (tried >= 4) break;
      tried++;
      let url = `https://${this.lang}.${domain}${path}`;
      let res;
      try {
        res = await Network.get(url);
      } catch (e) {
        last = String(e);
        continue;
      }
      if (res.status === 200 && res.body && res.body.length > 500) {
        this._workingDomain = domain;
        return res;
      }
      last = `${domain}: ${res.status}`;
      if (res.body && res.body.indexOf("challenge_required") >= 0) {
        last += "(需要人机验证)";
      }
    }
    throw `包子漫画请求失败(${last})，所有域名均不可用，请在设置里切换主域名`;
  }

  /// 账号
  /// 设置为null禁用账号功能
  account = {
    /// 登录
    /// 返回任意值表示登录成功
    login: async (account, pwd) => {
      let res = await Network.post(
        `${this.baseUrl}/api/bui/signin`,
        {
          "content-type":
            "multipart/form-data; boundary=----WebKitFormBoundaryFUNUxpOwyUaDop8s",
        },
        '------WebKitFormBoundaryFUNUxpOwyUaDop8s\r\nContent-Disposition: form-data; name="username"\r\n\r\n' +
        account +
        '\r\n------WebKitFormBoundaryFUNUxpOwyUaDop8s\r\nContent-Disposition: form-data; name="password"\r\n\r\n' +
        pwd +
        "\r\n------WebKitFormBoundaryFUNUxpOwyUaDop8s--\r\n"
      );
      if (res.status !== 200) {
        throw "Invalid status code: " + res.status;
      }
      let json = JSON.parse(res.body);
      let token = json.data;
      Network.setCookies(this.baseUrl, [
        new Cookie({
          name: "TSID",
          value: token,
          domain: this.loadSetting("domains") || this.settings.domains.default,
        }),
      ]);
      return "ok";
    },

    // 退出登录时将会调用此函数
    logout: function () {
      Network.deleteCookies(
        this.loadSetting("domains") || this.settings.domains.default
      );
    },

    get registerWebsite() {
      return `${this.baseUrl}/user/signup`;
    },
  };

  /// 解析漫画列表
  parseComic(e) {
    let url = e.querySelector("a").attributes["href"];
    let id = url.split("/").pop();
    let title = e.querySelector("h3").text.trim();
    let cover = e.querySelector("a > amp-img").attributes["src"];
    let tags = e.querySelectorAll("div.tabs > span").map((e) => e.text.trim());
    let description = e.querySelector("small").text.trim();
    return {
      id: id,
      title: title,
      cover: cover,
      tags: tags,
      description: description,
    };
  }

  parseJsonComic(e) {
    return {
      id: e.comic_id,
      title: e.name,
      subTitle: e.author,
      cover: `https://static-tw.baozimh.com/cover/${e.topic_img}?w=285&h=375&q=100`,
      tags: e.type_names,
    };
  }

  /// 探索页面
  /// 一个漫画源可以有多个探索页面
  explore = [
    {
      /// 标题
      /// 标题同时用作标识符, 不能重复
      title: "包子漫画",

      /// singlePageWithMultiPart 或者 multiPageComicList
      type: "singlePageWithMultiPart",

      load: async () => {
        var res = await this.request("");
        let document = new HtmlDocument(res.body);
        let parts = document.querySelectorAll("div.index-recommend-items");
        let result = {};
        for (let part of parts) {
          let title = part.querySelector("div.catalog-title").text.trim();
          let comics = part
            .querySelectorAll("div.comics-card")
            .map((e) => this.parseComic(e));
          if (comics.length > 0) {
            result[title] = comics;
          }
        }
        return result;
      },
    },
  ];

  /// 分类页面
  /// 一个漫画源只能有一个分类页面, 也可以没有, 设置为null禁用分类页面
  category = {
    /// 标题, 同时为标识符, 不能与其他漫画源的分类页面重复
    title: "包子漫画",
    parts: [
      {
        name: "类型",

        // fixed 或者 random
        // random用于分类数量相当多时, 随机显示其中一部分
        type: "fixed",

        // 如果类型为random, 需要提供此字段, 表示同时显示的数量
        // randomNumber: 5,

        categories: [
          "全部",
          "恋爱",
          "纯爱",
          "古风",
          "异能",
          "悬疑",
          "剧情",
          "科幻",
          "奇幻",
          "玄幻",
          "穿越",
          "冒险",
          "推理",
          "武侠",
          "格斗",
          "战争",
          "热血",
          "搞笑",
          "大女主",
          "都市",
          "总裁",
          "后宫",
          "日常",
          "韩漫",
          "少年",
          "其它",
        ],

        // category或者search
        // 如果为category, 点击后将进入分类漫画页面, 使用下方的`categoryComics`加载漫画
        // 如果为search, 将进入搜索页面
        itemType: "category",

        // 若提供, 数量需要和`categories`一致, `categoryComics.load`方法将会收到此参数
        categoryParams: [
          "all",
          "lianai",
          "chunai",
          "gufeng",
          "yineng",
          "xuanyi",
          "juqing",
          "kehuan",
          "qihuan",
          "xuanhuan",
          "chuanyue",
          "mouxian",
          "tuili",
          "wuxia",
          "gedou",
          "zhanzheng",
          "rexie",
          "gaoxiao",
          "danuzhu",
          "dushi",
          "zongcai",
          "hougong",
          "richang",
          "hanman",
          "shaonian",
          "qita",
        ],
      },
    ],
    enableRankingPage: false,
  };

  /// 分类漫画页面, 即点击分类标签后进入的页面
  categoryComics = {
    load: async (category, param, options, page) => {
      let res = await this.request(
        `/api/bzmhq/amp_comic_list?type=${param}&region=${options[0]}&state=${options[1]}&filter=%2a&page=${page}&limit=36&language=${this.lang}&__amp_source_origin=https://${this.lang}.${this.domain}`
      );
      let maxPage = null;
      let json = JSON.parse(res.body);
      if (!json.next) {
        maxPage = page;
      }
      return {
        comics: json.items.map((e) => this.parseJsonComic(e)),
        maxPage: maxPage,
      };
    },
    // 提供选项
    optionList: [
      {
        options: ["all-全部", "cn-国漫", "jp-日本", "kr-韩国", "en-欧美"],
      },
      {
        options: ["all-全部", "serial-连载中", "pub-已完结"],
      },
    ],
  };

  /// 搜索
  search = {
    load: async (keyword, options, page) => {
      // 搜索页支持分页参数，原实现固定只取第一页
      let res = await this.request(
        `/search?q=${encodeURIComponent(keyword)}&page=${page || 1}`
      );
      let document = new HtmlDocument(res.body);
      let comics = document
        .querySelectorAll("div.comics-card")
        .map((e) => this.parseComic(e));
      return {
        comics: comics,
        maxPage: 1,
      };
    },

    // 提供选项
    optionList: [],
  };

  /// 收藏
  favorites = {
    /// 是否为多收藏夹
    multiFolder: false,
    /// 添加或者删除收藏
    addOrDelFavorite: async (comicId, folderId, isAdding) => {
      if (!isAdding) {
        let res = await Network.post(
          `${this.baseUrl}/user/operation_v2?op=del_bookmark&comic_id=${comicId}`
        );
        if (!res.status || res.status >= 400) {
          throw "Invalid status code: " + res.status;
        }
        return "ok";
      } else {
        let res = await Network.post(
          `${this.baseUrl}/user/operation_v2?op=set_bookmark&comic_id=${comicId}&chapter_slot=0`
        );
        if (!res.status || res.status >= 400) {
          throw "Invalid status code: " + res.status;
        }
        return "ok";
      }
    },
    // 加载收藏夹, 仅当multiFolder为true时有效
    // 当comicId不为null时, 需要同时返回包含该漫画的收藏夹
    loadFolders: null,
    /// 加载漫画
    loadComics: async (page, folder) => {
      let res = await Network.get(`${this.baseUrl}/user/my_bookshelf`);
      if (res.status !== 200) {
        throw "Invalid status code: " + res.status;
      }
      let document = new HtmlDocument(res.body);
      function parseComic(e) {
        let title = e.querySelector("h4 > a").text.trim();
        let url = e.querySelector("h4 > a").attributes["href"];
        let id = url.split("/").pop();
        let author = e
          .querySelector("div.info > ul")
          .children[1].text.split("：")[1]
          .trim();
        let description = e
          .querySelector("div.info > ul")
          .children[4].children[0].text.trim();

        return {
          id: id,
          title: title,
          subTitle: author,
          description: description,
          cover: e.querySelector("amp-img").attributes["src"],
        };
      }
      let comics = document
        .querySelectorAll("div.bookshelf-items")
        .map((e) => parseComic(e));
      return {
        comics: comics,
        maxPage: 1,
      };
    },
  };

  /// 单个漫画相关
  comic = {
    // 加载漫画信息
    loadInfo: async (id) => {
      let res = await this.request(`/comic/${id}`);
      let document = new HtmlDocument(res.body);

      let title = document.querySelector("h1.comics-detail__title").text.trim();
      let cover = document.querySelector("div.l-content > div > div > amp-img")
        .attributes["src"];
      let author = document
        .querySelector("h2.comics-detail__author")
        .text.trim();
      let tags = document
        .querySelectorAll("div.tag-list > span")
        .map((e) => e.text.trim());
      tags = [...tags.filter((e) => e !== "")];
      let updateTime = document
        .querySelector("div.supporting-text > div > span > em")
        ?.text.trim()
        .replace("(", "")
        .replace(")", "");
      if (!updateTime) {
        const getLastChapterText = () => {
          // 合并所有章节容器（处理可能存在多个列表的情况）
          const containers = [
            ...document.querySelectorAll(
              "#chapter-items, #chapters_other_list"
            ),
          ];
          let allChapters = [];
          containers.forEach((container) => {
            const chapters = container.querySelectorAll(".comics-chapters > a");
            allChapters.push(...Array.from(chapters));
          });
          const lastChapter = allChapters[allChapters.length - 1];
          return (
            lastChapter?.querySelector("div > span")?.text.trim() ||
            "暂无更新信息"
          );
        };
        updateTime = getLastChapterText();
      }
      let description = document
        .querySelector("p.comics-detail__desc")
        .text.trim();
      // 章节链接形如 /user/page_direct?comic_id=xxx&section_slot=0&chapter_slot=12
      // comic_id 与网页 slug 不一定相同（站点会做别名跳转），必须从链接里取真实 id。
      let chapters = new Map();
      let realComicId = null;
      let collectChapters = (selector) => {
        for (let a of document.querySelectorAll(selector)) {
          let href = (a.attributes && a.attributes["href"]) || "";
          let m = href.match(
            /comic_id=([^&]+).*?section_slot=(\d+).*?chapter_slot=(\d+)/
          );
          let span = a.querySelector("div > span");
          let title = (span ? span.text : a.text).trim();
          if (m) {
            realComicId = realComicId || m[1];
            chapters.set(`${m[2]}_${m[3]}`, title);
          }
        }
      };
      collectChapters("div#chapter-items a");
      collectChapters("div#chapters_other_list a");
      if (chapters.size === 0) {
        collectChapters("div.comics-chapters a");
      }
      if (realComicId) {
        this.saveData(`realid_${id}`, realComicId);
      }
      let recommend = [];
      for (let c of document.querySelectorAll("div.recommend--item")) {
        if (c.querySelectorAll("div.tag-comic").length > 0) {
          let title = c.querySelector("span").text.trim();
          let cover = c.querySelector("amp-img").attributes["src"];
          let url = c.querySelector("a").attributes["href"];
          let id = url.split("/").pop();
          recommend.push({
            id: id,
            title: title,
            cover: cover,
          });
        }
      }
      // updateTime 将 Y年 M月 D日 转化为 Y-M-D
      let updateDate = updateTime
        .replace(/年/g, "-")
        .replace(/月/g, "-")
        .replace(/日/g, "");

      return new ComicDetails({
        title: title,
        cover: cover,
        description: description,
        tags: {
          作者: [author],
          标签: tags,
        },
        chapters: chapters,
        recommend: recommend,
        updateTime: updateDate,
      });
    },
    loadEp: async (comicId, epId) => {
      // 真实 comic_id：优先用 loadInfo 缓存，否则现取一次详情页
      let realId = this.loadData(`realid_${comicId}`);
      if (!realId) {
        let detail = await this.request(`/comic/${comicId}`);
        let m = detail.body.match(
          /comic_id=([^&"']+).*?section_slot=(\d+).*?chapter_slot=(\d+)/
        );
        if (!m) {
          throw "包子漫画: 无法解析该漫画的真实 comic_id";
        }
        realId = m[1];
        this.saveData(`realid_${comicId}`, realId);
      }

      // epId 形如 "0_12"（section_slot_chapter_slot），兼容旧的纯序号写法
      let ep = String(epId || "");
      let section = "0";
      let chapter = ep;
      let mm = ep.match(/^(\d+)[_-](\d+)$/);
      if (mm) {
        section = mm[1];
        chapter = mm[2];
      }

      let res = await this.request(
        `/user/page_direct?comic_id=${realId}&section_slot=${section}&chapter_slot=${chapter}`
      );

      let doc = new HtmlDocument(res.body);
      let nodes = doc.querySelectorAll(
        ".comic-contain amp-img[data-src], .comic-contain img[data-src]"
      );
      if (nodes.length === 0) {
        // 兜底：整页里所有带 data-src 的图片
        nodes = doc.querySelectorAll("amp-img[data-src], img[data-src]");
      }

      let cdn = this.loadSetting("cdn_domains") || "";
      let quality = this.loadSetting("image_quality") || "";
      const images = [];
      for (let imgNode of nodes) {
        let imgUrl = imgNode.attributes["data-src"];
        if (!imgUrl) continue;
        const match = imgUrl.match(/^(https?:\/\/)?([^/\s:]+)(:\d+)?(\/[a-z]comic\/.*)/);
        if (match) {
          const domain = cdn === "" ? match[2] : cdn;
          imgUrl = `https://${domain}${quality}${match[4]}`;
        }
        images.push(imgUrl);
      }
      if (images.length === 0) {
        throw "包子漫画: 该章节没有解析到图片（站点可能改版）";
      }
      return { images: images };
    },
  };
}
