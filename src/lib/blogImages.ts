// Local inline images, dropped in as they're supplied — keyed by post TITLE
// (not id: Supabase-backed posts get a random uuid, so id can't be a stable
// key). Used both as each post's cover image in the blog grid and as the
// image at the top of the full article view.
// `aspect` is each image's own native width/height ratio — used as the box
// shape so `cover` fills it with no cropping, instead of forcing every photo
// into the same box and slicing off whatever doesn't fit.
export const BLOG_IMAGES: Record<string, { source: number; aspect: number }> = {
  'The Hidden Cost of Ignoring Female Biology at Work': {
    source: require('../../assets/blog/post-2.png'),
    aspect: 1448 / 1086,
  },
  "Cycle Tracking Isn't About Periods. It's About Performance.": {
    source: require('../../assets/blog/post-3.png'),
    aspect: 1672 / 941,
  },
  'Decision Fatigue and the Menstrual Cycle': {
    source: require('../../assets/blog/post-4.png'),
    aspect: 1983 / 793,
  },
  "The Future of Women's Leadership Is Biological Intelligence": {
    source: require('../../assets/blog/post-5.jpg'),
    aspect: 1983 / 793,
  },
  'Why Burnout Hits High-Achieving Women Differently': {
    source: require('../../assets/blog/post-7.jpg'),
    aspect: 1672 / 940,
  },
  "Why Women Shouldn't Negotiate Salary During One Phase of Their Cycle": {
    source: require('../../assets/blog/post-9.jpg'),
    aspect: 1672 / 941,
  },
  'The Best Week to Launch Your Startup - According to Your Hormones': {
    source: require('../../assets/blog/post-10.jpg'),
    aspect: 1672 / 941,
  },
  "Why PMS Is Costing Companies Millions - And Nobody's Measuring It": {
    source: require('../../assets/blog/post-11.jpg'),
    aspect: 1672 / 941,
  },
  "CEO Performance Changes Across the Cycle - Here's What Nobody Measures": {
    source: require('../../assets/blog/post-12.jpg'),
    aspect: 1672 / 941,
  },
  'The Hormonal Productivity Calendar Every Woman Needs': {
    source: require('../../assets/blog/post-13.jpg'),
    aspect: 1672 / 941,
  },
  'Nobody Told Women This Productivity Secret. Until Now.': {
    source: require('../../assets/blog/post-14.jpg'),
    aspect: 1672 / 941,
  },
  'Why Your Calendar Is Sabotaging Your Career': {
    source: require('../../assets/blog/post-15.jpg'),
    aspect: 1672 / 941,
  },
};
