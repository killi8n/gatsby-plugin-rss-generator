import merge from 'lodash.merge'
import RSS from 'rss'
import fs from 'fs-extra'
import path from 'path'
import { runQuery } from './utils'

const publicPath = './public'

export const defaultOptions = {
    generator: `GatsbyJS`,
    query: `
        {
            site {
                siteMetadata {
                    title
                    description
                    siteUrl
                    site_url: siteUrl
                }
            }
        }
    `,
    setup: ({
        query: { siteMetadata, ...rest }
    }) => {
        return {
            ...siteMetadata,
            ...rest
        }
    }
}

exports.onPostBuild = async ({ graphql, reporter }, pluginOptions) => {
    const options = {
        ...defaultOptions,
        ...pluginOptions
    }

    const baseQuery = await runQuery(graphql, options.query)

    for (const { ...feed } of options.feeds) {
        if (feed.query) {
            feed.query = await runQuery(graphql, feed.query).then(res =>
                merge({}, baseQuery, res)
            )
        }

        const {
            setup,
            ...inner
        } = {
            ...options,
            ...feed
        }

        if (!feed.serialize || typeof feed.serialize !== "function") {
            reporter.warn(
                `You did not pass in a valid serialize function. Your feed will not be generated.`
            )
        } else {
            const rssFeed = (await feed.serialize(inner)).reduce((merged, item) => {
                merged.item(item)
                return merged
            }, new RSS(setup(inner)))

            const outputPath = path.join(publicPath, feed.output)
            const outputDir = path.dirname(outputPath)
            if (!(await fs.pathExists(outputDir))) {
                await fs.mkdir(outputDir)
            }
            await fs.writeFile(outputPath, rssFeed.xml())
        }
    }
}