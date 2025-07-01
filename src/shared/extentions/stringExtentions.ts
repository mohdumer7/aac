// Extend the global String interface
declare global {
  interface String {
    toProperCase(): string;
    capitalizeSentence(): string;
  }
}

// Capitalize each word in a string
const toProperCase = function (this: string): string {
  if (this){
    return this.toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  }
  else{
    return '';
  }
 
};

// Capitalize the first letter of each sentence
const capitalizeSentence = function (this: string, str?: string): string {
  if (!str) str = this;

  let sentences = str.split('.');
  let updated: string[] = [];

  sentences.forEach((sentence) => {
    if (sentence) {
      if (sentence[0] !== ' ') {
        updated.push(sentence.charAt(0).toUpperCase() + sentence.slice(1));
      } else {
        updated.push(' ' + sentence.charAt(1).toUpperCase() + sentence.slice(2));
      }
    }
  });

  let final = updated.join('.');
  if (str.endsWith('.')) {
    final += '.';
  }

  return final;
};

String.prototype.toProperCase = toProperCase;
String.prototype.capitalizeSentence = capitalizeSentence;

export {}; 
