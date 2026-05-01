/**
 * Bangumi 集成模块
 * 直接调用 Bangumi 官方 API (v0)
 */

const BangumiAPI = (() => {
  // Bangumi API v0 基础地址
  const BANGUMI_API = 'https://api.bgm.tv';

  // 本地缓存
  const cache = new Map();
  const CACHE_DURATION = 3600000; // 1小时

  // 正在进行的请求（去重）
  const pendingRequests = new Map();

  /**
   * 获取番剧时间表（日历）
   * @returns {Promise<Object>}
   */
  async function getCalendar() {
    const cacheKey = 'calendar';
    const cached = getCache(cacheKey);
    if (cached) return cached;

    const result = await fetchWithRetry(`${BANGUMI_API}/calendar`);
    if (result && result.length > 0) {
      // 转换为 { 1: [...], 2: [...], ... } 格式（1=周一，7=周日）
      const calendarData = {};
      result.forEach(day => {
        calendarData[day.weekday.id] = day.items || [];
      });
      setCache(cacheKey, calendarData);
      return calendarData;
    }
    return null;
  }

  /**
   * 搜索番剧
   * @param {string} keyword - 搜索关键词
   * @param {number} maxResults - 最大结果数
   * @returns {Promise<Array>}
   */
  async function search(keyword, maxResults = 3) {
    if (!keyword) return [];

    const cacheKey = `search:${keyword}`;
    const cached = getCache(cacheKey);
    if (cached) return cached;

    // 使用 v0 API 搜索
    const result = await fetchWithRetry(
      `${BANGUMI_API}/search/subject/${encodeURIComponent(keyword)}?type=2&responseGroup=medium&max_results=${maxResults}`
    );

    const items = (result?.list || []).map(item => normalizeSubject(item));
    setCache(cacheKey, items);
    return items;
  }

  /**
   * 获取番剧详情
   * @param {number} id - Bangumi 条目 ID
   * @returns {Promise<Object>}
   */
  async function getSubject(id) {
    if (!id) return null;

    const cacheKey = `subject:${id}`;
    const cached = getCache(cacheKey);
    if (cached) return cached;

    const result = await fetchWithRetry(`${BANGUMI_API}/v0/subjects/${id}`);
    const item = result ? normalizeSubjectDetail(result) : null;
    if (item) setCache(cacheKey, item);
    return item;
  }

  /**
   * 匹配番剧名
   * @param {string} title - 本地番剧名
   * @param {Array} bangumiList - Bangumi 数据列表
   * @returns {Object|null}
   */
  function matchAnime(title, bangumiList) {
    if (!title || !bangumiList || bangumiList.length === 0) return null;

    // 精确匹配
    let match = bangumiList.find(b =>
      b.name_cn === title ||
      b.name === title
    );

    // 去掉空格、特殊字符后匹配
    if (!match) {
      const normalize = s => s.replace(/[\s\-～~·：:！!。.（）()「」\[\]【】第季期]/g, '').toLowerCase();
      const normTitle = normalize(title);
      match = bangumiList.find(b =>
        normalize(b.name_cn) === normTitle ||
        normalize(b.name) === normTitle
      );
    }

    // 包含匹配（番剧名是 Bangumi 名的子串或反之）
    if (!match) {
      const lt = title.toLowerCase();
      match = bangumiList.find(b =>
        lt.includes(b.name_cn?.toLowerCase()) ||
        lt.includes(b.name?.toLowerCase()) ||
        b.name_cn?.toLowerCase().includes(lt) ||
        b.name?.toLowerCase().includes(lt)
      );
    }

    return match || null;
  }

  /**
   * 批量匹配：为整个番表匹配 Bangumi 数据
   * @param {Array} animes - 本地番表数据
   * @param {Object} calendarData - Bangumi 日历数据
   * @returns {Map<number, Object>} 索引 -> Bangumi 数据
   */
  function batchMatch(animes, calendarData) {
    // 展平所有星期的番剧
    const allBangumi = [];
    if (calendarData) {
      for (const day of Object.values(calendarData)) {
        allBangumi.push(...day);
      }
    }

    const resultMap = new Map();
    for (let i = 0; i < animes.length; i++) {
      const matched = matchAnime(animes[i].title, allBangumi);
      if (matched) {
        resultMap.set(i, matched);
      }
    }
    return resultMap;
  }

  // ---- 内部工具 ----

  async function fetchWithRetry(url, retries = 2) {
    // 去重：同一个 URL 不重复请求
    if (pendingRequests.has(url)) {
      return pendingRequests.get(url);
    }

    const promise = (async () => {
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const res = await fetch(url, {
            mode: 'cors',
            headers: {
              'User-Agent': 'YouComicClub/1.0',
              'Accept': 'application/json',
            }
          });

          if (res.ok) {
            return await res.json();
          }

          if (res.status === 429 && attempt < retries) {
            await sleep(1000 * (attempt + 1));
            continue;
          }

          throw new Error(`API 返回 ${res.status}`);
        } catch (err) {
          if (attempt < retries) {
            await sleep(500 * (attempt + 1));
            continue;
          }
          console.warn(`[Bangumi] 请求失败: ${url}`, err.message);
          return null;
        }
      }
      return null;
    })();

    pendingRequests.set(url, promise);
    try {
      return await promise;
    } finally {
      pendingRequests.delete(url);
    }
  }

  function normalizeSubject(item) {
    if (!item) return null;
    return {
      id: item.id,
      name: item.name,
      name_cn: item.name_cn || item.name,
      images: item.images ? {
        large: item.images.large,
        common: item.images.common,
        medium: item.images.medium,
        small: item.images.small,
      } : null,
      rating: item.rating ? {
        score: item.rating.score,
        total: item.rating.total,
      } : null,
      summary: item.summary || null,
      air_date: item.air_date || null,
      eps: item.eps || null,
      ep: item.eps || null,
    };
  }

  function normalizeSubjectDetail(item) {
    if (!item) return null;
    return {
      id: item.id,
      name: item.name,
      name_cn: item.name_cn || item.name,
      images: item.images ? {
        large: item.images.large,
        common: item.images.common,
        medium: item.images.medium,
        small: item.images.small,
      } : null,
      rating: item.rating ? {
        score: item.rating.score,
        total: item.rating.total,
      } : null,
      summary: item.summary || null,
      air_date: item.air_date || null,
      eps: item.eps || null,
      tags: (item.tags || []).map(t => t.name),
      characters: (item.characters || []).map(c => ({
        id: c.id,
        name: c.name,
        images: c.images?.medium,
      })),
    };
  }

  function getCache(key) {
    const entry = cache.get(key);
    if (entry && Date.now() - entry.time < CACHE_DURATION) {
      return entry.data;
    }
    cache.delete(key);
    return null;
  }

  function setCache(key, data, ttl = CACHE_DURATION) {
    cache.set(key, { data, time: Date.now(), ttl });
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  return {
    search,
    getSubject,
    getCalendar,
    matchAnime,
    batchMatch,
    API_BASE: BANGUMI_API,
  };
})();

/**
 * 追番追踪（localStorage）
 */
const WatchList = (() => {
  const STORAGE_KEY = 'youcomic-watchlist';

  function getAll() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
      return {};
    }
  }

  function save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function toggle(animeTitle, bangumiId = null) {
    const list = getAll();
    if (list[animeTitle]) {
      delete list[animeTitle];
    } else {
      list[animeTitle] = {
        bangumiId,
        addedAt: new Date().toISOString(),
      };
    }
    save(list);
    return isWatching(animeTitle);
  }

  function isWatching(animeTitle) {
    return !!getAll()[animeTitle];
  }

  function getList() {
    return getAll();
  }

  return { toggle, isWatching, getList, getAll };
})();
