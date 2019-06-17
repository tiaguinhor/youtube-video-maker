const algorithmia = require('algorithmia');
const algorithmiaApiKey = require('../credentials/algorithmia.json').apikey;
const watsonJson = require('../credentials/watson.json');
const sentenceBoundaryDetection = require('sbd');
const NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js');
const state = require('./state');

const nlu = new NaturalLanguageUnderstandingV1({
  iam_apikey: watsonJson.apikey,
  version: '2018-04-05',
  url: watsonJson.url
});

async function robot() {
  const content = state.load();

  await fetchContentFromWikipedia(content);
  sanitizeContent(content);
  breakContentIntoSentences(content);
  limitMaximumSentences(content);
  await fetchAllSentenceKeywords(content);

  state.save(content);

  async function fetchAllSentenceKeywords(content) {
    for (const sentence of content.sentences) {
      sentence.keywords = await fetchWatsonAndReturnKeywords(sentence.text);
    }
  }

  async function fetchWatsonAndReturnKeywords(sentence) {
    return new Promise((resolve, reject) => {
      nlu.analyze(
        {
          text: sentence,
          features: {
            keywords: {}
          }
        },
        (error, response) => {
          if (error) {
            reject(error);
            return;
          }

          const keywords = response.keywords.map(keyword => {
            return keyword.text;
          });

          resolve(keywords);
        }
      );
    });
  }

  async function fetchContentFromWikipedia(content) {
    console.log('> [text-robot] Fetching content from Wikipedia');

    const algorithmiaAuthenticated = algorithmia(algorithmiaApiKey);
    const wikipediaAlgorithm = algorithmiaAuthenticated.algo(
      'web/WikipediaParser/0.1.2'
    );
    const wikipediaResponse = await wikipediaAlgorithm.pipe(content.searchTerm);
    const wikipediaContent = wikipediaResponse.get();

    content.sourceContentOriginal = wikipediaContent.content;
    console.log('> [text-robot] Fetching done!');
  }

  async function sanitizeContent(content) {
    const withoutBlankLinesAndMarkdown = removeBlankLinesAndMarkdown(
      content.sourceContentOriginal
    );
    const withoutDatesInParentheses = removeDatesInParentheses(
      withoutBlankLinesAndMarkdown
    );

    content.sourceContentSanitize = withoutDatesInParentheses;

    function removeBlankLinesAndMarkdown(text) {
      const allLines = text.split('\n');

      const withoutBlankLinesAndMarkdown = allLines.filter(line => {
        return line.trim().length !== 0 || !line.trim().startsWith('=');
      });

      return withoutBlankLinesAndMarkdown.join(' ');
    }
  }

  async function breakContentIntoSentences(content) {
    content.sentences = [];

    const sentences = sentenceBoundaryDetection.sentences(
      content.sourceContentSanitize
    );
    sentences.forEach(sentence => {
      content.sentences.push({
        text: sentence,
        keyword: [],
        images: []
      });
    });
  }

  function removeDatesInParentheses(text) {
    return text.replace(/\((?:\([^()]*\)|[^()])*\)/gm, '').replace(/  /g, ' ');
  }

  function limitMaximumSentences(content) {
    content.sentences = content.sentences.slice(0, content.maximumSentences);
  }
}

module.exports = robot;
