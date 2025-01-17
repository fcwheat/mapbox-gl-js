// @flow

import {Color} from './values.js';
import type {Expression} from './expression.js';

import type Point from '@mapbox/point-geometry';
import type {FormattedSection} from './types/formatted.js';
import type {GlobalProperties, Feature, FeatureState} from './index.js';
import type {CanonicalTileID} from '../../source/tile_id.js';
import type {FeatureDistanceData} from '../feature_filter/index.js';

const geometryTypes = ['Unknown', 'Point', 'LineString', 'Polygon'];

class EvaluationContext {
    globals: GlobalProperties;
    feature: ?Feature;
    featureState: ?FeatureState;
    formattedSection: ?FormattedSection;
    availableImages: ?Array<string>;
    canonical: null | CanonicalTileID;
    featureTileCoord: ?Point;
    featureDistanceData: ?FeatureDistanceData;
    options: ?Map<string, Expression>;

    _parseColorCache: {[_: string]: ?Color};

    constructor(options?: ?Map<string, Expression>) {
        this.globals = (null: any);
        this.feature = null;
        this.featureState = null;
        this.formattedSection = null;
        this._parseColorCache = {};
        this.availableImages = null;
        this.canonical = null;
        this.featureTileCoord = null;
        this.featureDistanceData = null;
        this.options = options;
    }

    id(): number | null {
        return this.feature && this.feature.id !== undefined ? this.feature.id : null;
    }

    geometryType(): null | string {
        return this.feature ? typeof this.feature.type === 'number' ? geometryTypes[this.feature.type] : this.feature.type : null;
    }

    geometry(): ?Array<Array<Point>> {
        return this.feature && 'geometry' in this.feature ? this.feature.geometry : null;
    }

    canonicalID(): null | CanonicalTileID {
        return this.canonical;
    }

    properties(): {[string]: any} {
        return (this.feature && this.feature.properties) || {};
    }

    measureLight(_: string): number {
        return this.globals.brightness || 0;
    }

    distanceFromCenter(): number {
        if (this.featureTileCoord && this.featureDistanceData) {

            const c = this.featureDistanceData.center;
            const scale = this.featureDistanceData.scale;
            const {x, y} = this.featureTileCoord;

            // Calculate the distance vector `d` (left handed)
            const dX = x * scale - c[0];
            const dY = y * scale - c[1];

            // The bearing vector `b` (left handed)
            const bX = this.featureDistanceData.bearing[0];
            const bY = this.featureDistanceData.bearing[1];

            // Distance is calculated as `dot(d, v)`
            const dist = (bX * dX + bY * dY);
            return dist;
        }

        return 0;
    }

    parseColor(input: string): ?Color {
        let cached = this._parseColorCache[input];
        if (!cached) {
            cached = this._parseColorCache[input] = Color.parse(input);
        }
        return cached;
    }

    getConfig(id: string): ?Expression {
        return this.options ? this.options.get(id) : null;
    }
}

export default EvaluationContext;
