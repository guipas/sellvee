'use strict';

const langs = {
  fr : require('../lang/fr'),// eslint-disable-line
};

module.exports = config => words => {
  const local = config.locale;

  if (!local || !langs[local]) { return words }

  const translation = langs[local][words];

  if (translation) { return translation; }

  return words;
};
