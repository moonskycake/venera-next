/** @type {import('./_venera_.js')} */
class ManWaBa extends ComicSource {
  // Note: The fields which are marked as [Optional] should be removed if not used

  // name of the source
  name = "漫蛙吧";

  // unique id of the source
  key = "manwaba";

  version = "1.0.4-debug1";

  minAppVersion = "1.4.0";

  // update url
  url = "https://cdn.jsdelivr.net/gh/moonskycake/venera-next@main/manwaba.js";

  // 接口域名：mwuu.cc 已停用（部分网络 DNS 直接失败，其余会 301 跳到 manwaxu.cc）
  // 这里保留候选列表 + 自动切换，站点再换域名时只需在设置里改一项。
  static defaultApiHost = "manwaxu.cc";

  static apiHostCandidates = ["manwaxu.cc", "mwuu.cc"];

  // 图片源（接口要求显式传入，站点换图床时需要改这里）
  static defaultImageSource = "https://tu.mhttu.cc";

  get apiHost() {
    return this._apiHost || this.loadSetting("api_host") || ManWaBa.defaultApiHost;
  }

  get api() {
    return `https://${this.apiHost}/api`;
  }

  get imageSource() {
    return this.loadSetting("image_source") || ManWaBa.defaultImageSource;
  }

  settings = {
    api_host: {
      title: "接口域名",
      type: "select",
      options: [
        { value: "manwaxu.cc" },
        { value: "mwuu.cc" },
      ],
      default: "manwaxu.cc",
    },
    image_source: {
      title: "图床地址",
      type: "select",
      options: [
        { value: "https://tu.mhttu.cc" },
      ],
      default: "https://tu.mhttu.cc",
    },
  };

  init() {
    /**
     * Sends an HTTP request.
     * @param {string} url - The URL to send the request to.
     * @param {string} method - The HTTP method (e.g., GET, POST, PUT, PATCH, DELETE).
     * @param {Object} params - The query parameters to include in the request.
     * @param {Object} headers - The headers to include in the request.
     * @param {string} payload - The payload to include in the request.
     * @returns {Promise<Object>} The response from the request.
     */
    // 统一请求入口：传入的完整 URL 会被替换成当前可用域名，失败时自动换域名重试
    this.fetchJson = async (
      url,
      { method = "GET", params, headers, payload } = {}
    ) => {
      let path = String(url).replace(/^https:\/\/[^/]+\/api/, "");
      let query = "";
      if (params) {
        query =
          "?" +
          Object.keys(params)
            .filter((k) => params[k] !== undefined && params[k] !== null)
            .map((k) => `${k}=${encodeURIComponent(params[k])}`)
            .join("&");
      }
      let hosts = [];
      let add = (h) => {
        if (h && hosts.indexOf(h) < 0) hosts.push(h);
      };
      add(this._apiHost);
      add(this.loadSetting("api_host") || ManWaBa.defaultApiHost);
      for (let h of ManWaBa.apiHostCandidates) add(h);

      let last = "";
      for (let host of hosts) {
        let res;
        try {
          res = await Network.sendRequest(
            method,
            `https://${host}/api${path}${query}`,
            headers,
            payload
          );
        } catch (e) {
          last = `${host}: ${e}`;
          continue;
        }
        if (res.status === 200) {
          this._apiHost = host;
          return JSON.parse(res.body);
        }
        last = `${host}: ${res.status}`;
      }
      throw `漫蛙请求失败(${last})，接口域名可能已更换，请在设置里修改「接口域名」`;
    };
    this.logger = {
      error: (msg) => {
        log("error", this.name, msg);
      },
      info: (msg) => {
        log("info", this.name, msg);
      },
      warn: (msg) => {
        log("warning", this.name, msg);
      },
    };
  }

  // explore page list
  explore = [
    {
      // title of the page.
      // title is used to identify the page, it should be unique
      title: this.name,

      /// multiPartPage or multiPageComicList or mixed
      type: "singlePageWithMultiPart",

      /**
       * load function
       * @param page {number | null} - page number, null for `singlePageWithMultiPart` type
       * @returns {{}}
       * - for `multiPartPage` type, return [{title: string, comics: Comic[], viewMore: PageJumpTarget}]
       * - for `multiPageComicList` type, for each page(1-based), return {comics: Comic[], maxPage: number}
       * - for `mixed` type, use param `page` as index. for each index(0-based), return {data: [], maxPage: number?}, data is an array contains Comic[] or {title: string, comics: Comic[], viewMore: string?}
       */
      load: async (page) => {
        let params = {
          page: 1,
          pageSize: 6,
          type: "",
          flag: false,
        };
        const url = `${this.api}/home`;
        const data = await this.fetchJson(url, { params }).then(
          (res) => res.data
        );
        let magnaList = {
          热门: data.comicList,
          最新完整版: data.gufengList,
          最新更新: data.xuanhuanList,
          热门收藏: data.xiaoyuanList,
        };
        function parseComic(comic) {
          return new Comic({
            id: comic.id.toString(),
            title: comic.title,
            subTitle: comic.author,
            cover: comic.pic,
            tags: (comic.tags || "").split(",").filter((e) => e !== ""),
          });
        }
        let result = {};
        for (let key in magnaList) {
          result[key] = magnaList[key].map(parseComic);
        }
        return result;
      },
    },
  ];

  // categories
  category = {
    /// title of the category page, used to identify the page, it should be unique
    title: this.name,
    parts: [
      {
        // title of the part
        name: "类型",

        // fixed or random or dynamic
        // if random, need to provide `randomNumber` field, which indicates the number of comics to display at the same time
        // if dynamic, need to provide `loader` field, which indicates the function to load comics
        type: "fixed",

        // Remove this if type is dynamic
        categories: [
          "全部",
          "热血",
          "玄幻",
          "恋爱",
          "冒险",
          "古风",
          "都市",
          "穿越",
          "奇幻",
          "其他",
          "搞笑",
          "少男",
          "战斗",
          "重生",
          "逆袭",
          "爆笑",
          "少年",
          "后宫",
          "系统",
          "BL",
          "韩漫",
          "完整版",
          "19r",
          "台版",
        ],

        itemType: "category",
        categoryParams: [
          "",
          "热血",
          "玄幻",
          "恋爱",
          "冒险",
          "古风",
          "都市",
          "穿越",
          "奇幻",
          "其他",
          "搞笑",
          "少男",
          "战斗",
          "重生",
          "逆袭",
          "爆笑",
          "少年",
          "后宫",
          "系统",
          "BL",
          "韩漫",
          "完整版",
          "19r",
          "台版",
        ],
      },
    ],
    // enable ranking page
    enableRankingPage: false,
  };

  /// category comic loading related
  categoryComics = {
    /**
     * load comics of a category
     * @param category {string} - category name
     * @param param {string?} - category param
     * @param options {string[]} - options from optionList
     * @param page {number} - page number
     * @returns {Promise<{comics: Comic[], maxPage: number}>}
     */
    load: async (category, param, options, page) => {
      let pathMap = {
        "": "/cate",
        "热血": "/cate/hotblooded",
        "玄幻": "/cate/xuanhuan",
        "恋爱": "/cate/romance",
        "冒险": "/cate/adventure",
        "古风": "/cate/historical",
        "都市": "/cate/urban",
        "穿越": "/cate/transmigration",
        "奇幻": "/cate/fantasy",
        "搞笑": "/cate/comedy",
        "少男": "/cate/shounen",
        "战斗": "/cate/action",
        "重生": "/cate/rebirth",
        "逆袭": "/cate/counterattack",
        "爆笑": "/cate/hilarious",
        "少年": "/cate/youth",
        "系统": "/cate/system",
        "BL": "/cate/bl",
        "韩漫": "/cate/manhwa",
        "完整版": "/cate/fullversion",
        "19r": "/cate/19plus",
        "台版": "/cate/taiwanver",
      };
      let url = this.api + pathMap[param] || "/cate";
      let payload = JSON.stringify({
        page: {
          page: page,
          pageSize: 10,
        },
        category: "comic",
        sort: parseInt(options[2]),
        comic: {
          status: parseInt(options[0] == "2" ? -1 : options[0]),
          day: parseInt(options[1]),
          tag: param,
        },
        video: {
          year: 0,
          typeId: 0,
          typeId1: 0,
          area: "",
          lang: "",
          status: -1,
          day: 0,
        },
        novel: {
          status: -1,
          day: 0,
          sortId: 0,
        },
      });

      let data = await this.fetchJson(url, {
        method: "POST",
        payload,
      }).then((res) => res.data.list);

      function parseComic(comic) {
        return new Comic({
          id: comic.url.split("/").pop(),
          title: comic.title,
          subTitle: comic.author,
          cover: comic.pic,
          tags: comic.tags.split(","),
          description: comic.intro,
          status: comic.status == 0 ? "连载中" : "已完结",
        });
      }
      return {
        comics: data.map(parseComic),
        maxPage: 100,
      };
    },
    // provide options for category comic loading
    optionList: [
      {
        options: ["2-全部", "0-连载中", "1-已完结"],
      },
      {
        options: [
          "0-全部",
          "1-周一",
          "2-周二",
          "3-周三",
          "4-周四",
          "5-周五",
          "6-周六",
          "7-周日",
        ],
      },
      {
        options: ["0-更新", "1-新作", "2-畅销", "3-热门", "4-收藏"],
      },
    ],
  };

  /// search related
  search = {
    /**
     * load search result
     * @param keyword {string}
     * @param options {string[]} - options from optionList
     * @param page {number}
     * @returns {Promise<{comics: Comic[], maxPage: number}>}
     */
    load: async (keyword, options, page) => {
      const pageSize = 20;
      let url = `${this.api}/search`;
      let params = {
        keyword,
        type: "mh",
        page,
        pageSize,
      };
      let data = await this.fetchJson(url, { params }).then((res) => res.data);
      let total = data.total;
      let comics = data.list.map((item) => {
        return new Comic({
          id: item.id.toString(),
          title: item.title,
          subTitle: item.author,
          cover: item.cover,
          tags: (item.tags || "").split(",").filter((e) => e !== ""),
          description: item.description,
          status: item.status == 0 ? "连载中" : "已完结",
        });
      });
      let maxPage = Math.ceil(total / pageSize);
      return {
        comics,
        maxPage,
      };
    },
  };

  /// single comic related
  comic = {
    /**
     * load comic info
     * @param id {string}
     * @returns {Promise<ComicDetails>}s
     */
    loadInfo: async (id) => {
      let url = `${this.api}/comic/${id}`;
      let data = await this.fetchJson(url, { payload: undefined }).then(
        (res) => res.data
      );
      let chapterId = data.id;
      let chapterApi = `${this.api}/comic/chapter`;
      let pageRes = await this.fetchJson(chapterApi, {
        params: { comicId: chapterId, page: 1, pageSize: 1 },
      });
      let total = (pageRes.pagination && pageRes.pagination.total) || 0;

      let chapterList = [];
      if (total > 0) {
        let chapterRes = await this.fetchJson(chapterApi, {
          params: { comicId: chapterId, page: 1, pageSize: total },
        });
        chapterList = chapterRes.data || [];
        // 单次请求可能有上限，按分页补齐
        let page = 2;
        while (chapterList.length < total && page <= 30) {
          let more = await this.fetchJson(chapterApi, {
            params: { comicId: chapterId, page, pageSize: 100 },
          });
          let list = more.data || [];
          if (list.length === 0) break;
          chapterList = chapterList.concat(list);
          page++;
        }
      }
      let chapters = new Map();
      chapterList.forEach((item) => {
        chapters.set(item.id.toString(), String(item.title));
      });

      return new ComicDetails({
        title: String(data.title),
        subTitle: String(data.author || ""),
        cover: data.cover,
        tags: {
          类型: (data.tags || "").split(",").filter((e) => e !== ""),
          状态: data.status == 0 ? "连载中" : "已完结",
        },
        chapters,
        description: data.intro,
        updateTime: new Date(data.editTime * 1000).toLocaleDateString(),
      });
    },
    /**
     * load images of a chapter
     * @param comicId {string}
     * @param epId {string?}
     * @returns {Promise<{images: string[]}>}
     */
    loadEp: async (comicId, epId) => {
      let imgApi = `${this.api}/comic/image/${epId}`;
      // 服务端 pageSize 上限 100，且只认 snake_case 的 page_size（camel 会被忽略用默认 25）
      let pageSize = 100;
      let images = [];
      let page = 1;
      let totalPages = 1;
      do {
        let res = await this.fetchJson(imgApi, {
          params: {
            page: page,
            page_size: pageSize,
            imageSource: this.imageSource,
          },
        });
        let data = res.data || {};
        let list = data.images || [];
        let pagination = data.pagination || res.pagination || {};
        totalPages = pagination.total_pages || 1;
        for (let item of list) {
          let url = typeof item === "string" ? item : item.url;
          if (url) images.push(url);
        }
        page++;
      } while (page <= totalPages && page <= 20);

      if (images.length === 0) {
        throw "漫蛙: 该章节没有解析到图片（站点可能改版）";
      }
      return {
        images,
      };
    },
  };
}
