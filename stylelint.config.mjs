/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-standard'],
  rules: {
    'selector-class-pattern': null,
    'no-descending-specificity': null,
  },
  overrides: [
    {
      files: ['**/*.module.css'],
      rules: {
        'selector-pseudo-class-no-unknown': [
          true,
          { ignorePseudoClasses: ['global', 'local'] },
        ],
      },
    },
  ],
}
