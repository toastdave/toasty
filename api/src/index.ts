import { Hono } from 'hono'
import tmdb from "@/tmdb"

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.route('tmdb', tmdb)

export default {  
  port: 3000, 
  fetch: app.fetch, 
}
