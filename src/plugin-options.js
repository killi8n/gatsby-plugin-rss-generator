import { parse } from "gatsby/graphql"

const feed = ({ Joi }) => {
    return Joi.object({
        output: Joi.string().required(),
        query: Joi.string().required(),
        title: Joi.string(),
        serialize: Joi.func(),
    })
    .unknown(true)
    .external(({ query }) => {
        if (query) {
            try {
                parse(query)
            } catch (e) {
                throw new Error(
                    stripIndent`
              Invalid plugin options for "gatsby-plugin-rss-generator":
              "query" must be a valid GraphQL query. Received the error "${e.message}"`
                  )
            }
        }
    })
}

export default ({ Joi }) => {
    return Joi.object({
        query: Joi.string(),
        feeds: Joi.array().items(feed({ Joi }))
    })
}