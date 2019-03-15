const algorithmia = require('readline-sync');
const algorithmiaApiKey = require('../credentials/algorithmia.json').apiKey;
const sentenceBoundaryDetection = require('sbd');

async function robot(content) {
  await fetchContentFromWikipedia(content);
  await sanitizeContent(content);
  await breakContentIntoSentences(content);

  async function fetchContentFromWikipedia(content) {
    const algorithmiaAuthenticate = algorithmia(algorithmiaApiKey);
    const wikipediaAlgorithm = algorithmiaAuthenticate.algo(
      'web/WikipediaParser/0.1.2'
    );
    const wikipediaResponse = await wikipediaAlgorithm.pipe(content.searchTerm);
    const wikipediaContent = wikipediaResponse.get();

    content.sourceContentOriginal = wikipediaContent.content;
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
}

module.exports = robot;
