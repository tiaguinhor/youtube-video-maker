const readline = require('readline-sync');

function start() {
  const content = {};
  content.searchTerm = askAndReturnSearchTerm();
  content.prefix = askAndReturnPrefix();

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
}

start();
