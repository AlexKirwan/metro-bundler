/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @format
 */

'use strict';

const uglify = require('uglify-es');

const {
  compactMapping,
  fromRawMappings,
  toRawMappings,
} = require('../../Bundler/source-map');

import type {
  CompactRawMappings,
  MappingsMap,
  RawMappings,
} from '../../lib/SourceMap';

type ResultWithMap = {
  code: string,
  map: MappingsMap,
};

function noSourceMap(code: string): string {
  return minify(code).code;
}

function withSourceMap(
  code: string,
  sourceMap: ?MappingsMap | RawMappings,
  filename: string,
): ResultWithMap {
  if (sourceMap && Array.isArray(sourceMap)) {
    sourceMap = fromRawMappings([
      {code, source: code, map: sourceMap, path: filename},
    ]).toMap(undefined, {});
  }

  const result = minify(code, sourceMap);

  const map: MappingsMap = JSON.parse(result.map);
  map.sources = [filename];
  return {code: result.code, map};
}

function withRawMappings(
  code: string,
  map: RawMappings,
  filename: string,
): {code: string, map: CompactRawMappings} {
  const result = withSourceMap(code, map, filename);

  return {
    code: result.code,
    map: toRawMappings(result.map).map(compactMapping),
  };
}

function minify(inputCode: string, inputMap: ?MappingsMap) {
  const result = uglify.minify(inputCode, {
    mangle: {toplevel: true},
    output: {
      ascii_only: true,
      quote_style: 3,
      wrap_iife: true,
    },
    sourceMap: {
      content: inputMap,
      includeSources: false,
    },
    toplevel: true,
  });

  if (result.error) {
    throw result.error;
  }

  return {
    code: result.code,
    map: result.map,
  };
}

module.exports = {
  noSourceMap,
  withRawMappings,
  withSourceMap,
};
