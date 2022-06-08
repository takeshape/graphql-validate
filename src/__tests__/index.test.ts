
import test from 'ava';
import validate from '../index.js';

test('validate succeeds', async t => {
  await t.notThrowsAsync(validate({
    deprecated: false,
    noStrictFragments: false,
    apollo: false,
    keepClientFields: false,
    onlyErrors: false,
    relativePaths: false,
    silent: false
  }));
});
