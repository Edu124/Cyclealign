// Local inline images, dropped in as they're supplied — keyed by post TITLE
// (not id: Supabase-backed posts get a random uuid, so id can't be a stable
// key). Used both as each post's cover image in the blog grid and as the
// inline image inside the full article view.
// `aspect` is each image's own native width/height ratio — used as the box
// shape so `cover` fills it with no cropping, instead of forcing every photo
// into the same box and slicing off whatever doesn't fit.
export const BLOG_IMAGES: Record<string, { source: number; afterParagraph: number; aspect: number }> = {
  'The Hidden Cost of Ignoring Female Biology at Work': {
    source: require('../../assets/blog/post-2.png'),
    afterParagraph: 1,
    aspect: 1448 / 1086,
  },
  "Cycle Tracking Isn't About Periods. It's About Performance.": {
    source: require('../../assets/blog/post-3.png'),
    afterParagraph: 1,
    aspect: 1672 / 941,
  },
  'Decision Fatigue and the Menstrual Cycle': {
    source: require('../../assets/blog/post-4.png'),
    afterParagraph: 1,
    aspect: 1983 / 793,
  },
  "The Future of Women's Leadership Is Biological Intelligence": {
    source: require('../../assets/blog/post-5.jpg'),
    afterParagraph: 1,
    aspect: 1983 / 793,
  },
};
