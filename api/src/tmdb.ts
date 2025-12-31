import { Hono } from 'hono'

const app = new Hono()

type QueryParams = Record<string, string | number | boolean>

class TMDBClient {
    private baseURL = 'https://api.themoviedb.org/3/'

    private headers : Record<string,string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.TMDB_TOKEN}`
    }

    private buildUrl(path: string, params?: QueryParams){
        const url = new URL(path, this.baseURL)
        if (params){
            for (const [k,v] of Object.entries(params)){
                url.searchParams.set(k, String(v))
            }
        }
        return url
    }

    public async request<T>(path: string, params?: QueryParams): Promise<T> {
        const res = await fetch(this.buildUrl(path, params), { headers: this.headers })

        if (!res.ok) {
            const body = await res.text().catch(() => '')
            throw new Error(`TMDB ${res.status} ${res.statusText}: ${body}`)
        }

        return res.json() as Promise<T>
    }
}

const tmdb = new TMDBClient()

// GET base route
app.get('/', (c) => c.json('tmdb'))

// GET Movies - Top Rated
app.get('/movies/top', async (c) => {
    const movies = await tmdb.request('movie/top_rated')

    return c.json(movies)
})

// GET Shows - Top Rated
app.get('/shows/top', async (c) => {
    const shows = await tmdb.request('tv/top_rated')
    return c.json(shows)
})

// GET Trending
app.get('trending', async (c) => {
    const trending = await tmdb.request('trending/all/week')
    return c.json(trending)
})

export default app