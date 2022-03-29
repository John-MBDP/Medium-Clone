import { GetStaticProps } from 'next'
import { Header } from '../../components/Header'
import { sanityClient, urlFor } from '../../sanity'
import { Post } from '../../typings'
import PortableText from 'react-portable-text'

interface Props {
  post: Post
}

function Post({ post }: Props) {
  return (
    <main>
      <Header />
      <img
        className="h-40 w-full object-cover"
        src={urlFor(post.mainImage).url()!}
        alt=""
      />

      <article className="mx-auto max-w-3xl p-5">
        <h1 className="mt-10 mb-3 text-3xl">{post.title}</h1>
        <h2 className="mb-2 text-xl font-light text-gray-500">
          {post.description}
        </h2>
        <div className="flex items-center space-x-2">
          <img
            className="h-10 w-10 rounded-full"
            src={urlFor(post.author.image).url()!}
            alt=""
          />
          <p className="text=s, font-extralight">
            Blog post by{' '}
            <span className="text-green-600">{post.author.name} </span>-
            Published at {new Date(post._createdAt).toLocaleString()}
          </p>
        </div>
        <div className="mt-10">
          <PortableText
            className=""
            dataset={process.env.NEXT_PUBLIC_SANITY_DATASET!}
            projectId={process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!}
            content={post.body}
            serializers={{
              h1: (props: any) => (
                <h1 className="my-5 text-2xl font-bold" {...props} />
              ),
              h2: (props: any) => (
                <h1 className="my-5 text-xl font-bold" {...props} />
              ),
              li: ({ children }: any) => (
                <li className="ml-4 list-disc">{children}</li>
              ),
              link: ({ href, children }: any) => (
                <a href={href} className="text-blue-500 hover:underline">
                  {children}
                </a>
              ),
            }}
          />
        </div>
      </article>
      <hr className="my-5 mx-auto max-w-lg border border-yellow-500" />
      <form className="my-5 mx-auto mb-10 flex max-w-2xl flex-col p-10">
        <h3 className="text-sm text-yellow-500">Enjoyed this article?</h3>
        <h4 className="text-3xl font-bold">Leave a comment below!</h4>
        <hr className="mt-2 py-3" />
        <label className="mb-5 block">
          <span className="text-gray-700">Name</span>
          <input
            className="form-input mt-1 block w-full rounded border py-2 px-3 shadow outline-none ring-yellow-500 focus:ring"
            placeholder="John appleseed"
            type="text"
          />
        </label>
        <label className="mb-5 block">
          <span className="text-gray-700">Email</span>
          <input
            className="form-input mt-1 block w-full rounded border py-2 px-3 shadow outline-none ring-yellow-500 focus:ring"
            placeholder="John appleseed"
            type="text"
          />
        </label>
        <label className="mb-5 block">
          <span className="text-gray-700">Comment</span>
          <textarea
            className="form-textarea mt-1 block w-full rounded border py-2 px-3 shadow outline-none ring-yellow-500 focus:ring"
            placeholder="John appleseed"
            rows={8}
          />
        </label>
      </form>
    </main>
  )
}

export default Post

//Find the pages that exists --> prepares the page
export const getStaticPaths = async () => {
  const query = `*[_type == "post"] {
    _id,
    slug {
    current
   }
  }`
  const posts = await sanityClient.fetch(query)

  /*NextJS expects an array and whereby each object inside must contain a key called params which will contain the actual path
    Data structure will look like this:
     [ {
       params: {
         slug: "post-1"
          }
       }
     ] 
  */
  const paths = posts.map((post: Post) => ({
    params: {
      slug: post.slug.current,
    },
  }))

  // blocking is use if the page doesn't exist (404)
  return { paths, fallback: 'blocking' }
}

//Have to use getStaticProps with getStaticPaths.  Handles the information from getStaticPaths.  How it's supposed to handle the id/slug
export const getStaticProps: GetStaticProps = async ({ params }) => {
  const query = `*[_type == "post" && slug.current == $slug][0]{
    _id,
    _createdAt,
    title,
    author-> {
    name,
    image
  },
  'comments': *[
    _type == "comment" &&
    post._ref == ^._id &&
    approved == true],
    description,
    mainImage,
    slug,
    body
  }`

  const post = await sanityClient.fetch(query, {
    slug: params?.slug,
  })

  //If you return an object called notFound in nextJS when using fallback blocking.  Render a 404 page
  if (!post) {
    return {
      notFound: true,
    }
  }

  return {
    props: {
      post,
    },
    revalidate: 60, // after 60 seconds, it'll update the old cache version
  }
}
