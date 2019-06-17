const readline = require('readline-sync');
const robots = {
  text: require('./robots/text')
};

async function start() {
  const content = {
    maximumSentences: 7
  };

  (content.searchTerm = askAndReturnSearchTerm()),
    (content.prefix = askAndReturnPrefix());

  await robots.text(content);

  function askAndReturnSearchTerm() {
    return readline.question('Type a wikipedia search theme: ');
  }

  function askAndReturnPrefix() {
    const prefixes = ["Who's", "What's", 'The history of'];
    const selectedPrefixIndex = readline.keyInSelect(
      prefixes,
      'Choose a option: '
    );

    return prefixes[selectedPrefixIndex];
  }

  console.log(JSON.stringify(content, null, 4));
}

start();
