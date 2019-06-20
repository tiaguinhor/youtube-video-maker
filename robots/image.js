const google = require('googleapis').google;
const customSearch = google.customsearch('v1');
const googleSearchCredentials = require('../credentials/google').search;
const state = require('./state');

async function robot() {
  const content = state.load();

  await fetchImagesOfAllSentences(content);

  state.save(content);

  async function fetchImagesOfAllSentences(content) {
    for (
      let sentenceIndex = 0;
      sentenceIndex < content.sentences.length;
      sentenceIndex++
    ) {
      let query;

      if (sentenceIndex === 0) {
        query = `${content.searchTerm}`;
      } else {
        query = `${content.searchTerm} ${
          content.sentences[sentenceIndex].keywords[0]
        }`;
      }

      console.log(`> [image-robot] Querying Google Images with: "${query}"`);

      content.sentences[
        sentenceIndex
      ].images = await fetchGoogleAndReturnImagesLinks(query);
      content.sentences[sentenceIndex].googleSearchQuery = query;
    }
  }

  async function fetchGoogleAndReturnImagesLinks(query) {
    const response = await customSearch.cse.list({
      auth: googleSearchCredentials.apikey,
      cx: googleSearchCredentials.searchEngineId,
      q: query,
      searchType: 'image',
      num: 2
    });

    const imagesUrl = response.data.items.map(item => {
      return item.link;
    });

    return imagesUrl;
  }
}

module.exports = robot;
