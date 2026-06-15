import axios from "axios";

const API_URL = process.env.NEWS_API_URL || "https://api.freenewsapi.io/v1";
const API_KEY = process.env.NEWS_API_KEY;

if (!API_KEY) {
  throw new Error("NEWS_API_KEY is not set");
}

const client = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { "x-api-key": API_KEY },
});

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 429) {
      const retryAfter = error.response.data?.retry_after_ms ?? 3000;
      console.warn(`[fetcher] Rate limited. Waiting ${retryAfter}ms before retry...`);
      await new Promise((resolve) => setTimeout(resolve, retryAfter));
      return client.request(error.config);
    }
    throw error;
  }
);

export interface ArticleListItem {
  uuid: string;
  title: string;
  published_at: string;
  publisher: string;
}

export interface ArticleListResponse {
  data: ArticleListItem[];
  meta: {
    page_size: number;
    returned: number;
    has_more: boolean;
    next_offset: number | null;
    next_cursor: string | null;
  };
}

export interface ArticleDetail {
  uuid: string;
  title: string;
  thumbnail: string | null;
  publisher: string;
  authors: string[];
  topics: string[];
  countries: string[];
  languages: string[];
  published_at: string;
  original_url: string;
  body: string;
}

export interface ArticleDetailResponse {
  data: ArticleDetail;
}

export async function fetchNewsList(
  topic: string,
  language = "pt-419",
  country = "BR",
  cursor?: string
): Promise<ArticleListResponse> {
  const params: Record<string, string> = {
    language,
    country,
    topic,
    order_by: "archive",
    page_size: "50",
  };
  if (cursor) params.next_cursor = cursor;

  const { data } = await client.get<ArticleListResponse>("/news", { params });
  return data;
}

export async function fetchArticleDetails(uuid: string): Promise<ArticleDetail> {
  const { data } = await client.get<ArticleDetailResponse>("/details", {
    params: { uuid },
  });
  return data.data;
}
