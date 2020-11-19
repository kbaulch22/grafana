import { defaultMetricAgg } from '../../../query_def';
import { ElasticsearchQuery } from '../../../types';
import { isMetricAggregationWithMeta, isMetricAggregationWithSettings, MetricAggregation } from '../aggregations';
import { getChildren, metricAggregationConfig } from '../utils';
import {
  ADD_METRIC,
  CHANGE_METRIC_TYPE,
  REMOVE_METRIC,
  TOGGLE_METRIC_VISIBILITY,
  MetricAggregationAction,
  CHANGE_METRIC_FIELD,
  CHANGE_METRIC_SETTING,
  CHANGE_METRIC_META,
  CHANGE_METRIC_ATTRIBUTE,
} from './types';

export const reducer = (state: MetricAggregation[], action: MetricAggregationAction): ElasticsearchQuery['metrics'] => {
  switch (action.type) {
    case ADD_METRIC:
      const nextId = parseInt(state[state.length - 1]?.id || '0', 10) + 1;
      return [...state, defaultMetricAgg(nextId.toString())];

    case REMOVE_METRIC:
      const metricToRemove = state.find(m => m.id === action.payload.id)!;
      const metricsToRemove = [metricToRemove, ...getChildren(metricToRemove, state)];
      const resultingMetrics = state.filter(metric => !metricsToRemove.some(toRemove => toRemove.id === metric.id));
      if (resultingMetrics.length === 0) {
        return [defaultMetricAgg('1')];
      }
      return resultingMetrics;

    case CHANGE_METRIC_TYPE:
      return state
        .filter(metric =>
          // When the new metric type is `isSingleMetric` we remove all other metrics from the query
          // leaving only the current one.
          !!metricAggregationConfig[action.payload.type].isSingleMetric ? metric.id === action.payload.id : true
        )
        .map(metric => {
          if (metric.id !== action.payload.id) {
            return metric;
          }

          /*
            TODO: The previous version of the query editor was keeping some of the old metric's configurations
            in the new selected one (such as field or some settings).
            It the future would be nice to have the same behavior but it's hard without a proper definition,
            as Elasticsearch will error sometimes if some settings are not compatible.
          */
          return {
            id: metric.id,
            type: action.payload.type,
          };
        });

    case CHANGE_METRIC_FIELD:
      return state.map(metric => {
        if (metric.id !== action.payload.id) {
          return metric;
        }

        return {
          ...metric,
          field: action.payload.field,
        };
      });

    case TOGGLE_METRIC_VISIBILITY:
      return state.map(metric => {
        if (metric.id !== action.payload.id) {
          return metric;
        }

        return {
          ...metric,
          hide: !metric.hide,
        };
      });

    case CHANGE_METRIC_SETTING:
      return state.map(metric => {
        if (metric.id !== action.payload.metric.id) {
          return metric;
        }

        // TODO: Here, instead of this if statement, we should assert that metric is MetricAggregationWithSettings
        if (isMetricAggregationWithSettings(metric)) {
          // FIXME: this can be done in a better way, also romeving empty objects
          const newSettings = Object.entries({
            ...metric.settings,
            [action.payload.settingName]: action.payload.newValue,
          }).reduce((acc, [key, value]) => {
            if (value?.length === 0) {
              return { ...acc };
            }
            return {
              ...acc,
              [key]: value,
            };
          }, {});

          return {
            ...metric,
            settings: {
              ...newSettings,
            },
          };
        }

        // This should never happen.
        return metric;
      });

    case CHANGE_METRIC_META:
      return state.map(metric => {
        if (metric.id !== action.payload.metric.id) {
          return metric;
        }

        // TODO: Here, instead of this if statement, we should assert that metric is MetricAggregationWithMeta
        if (isMetricAggregationWithMeta(metric)) {
          return {
            ...metric,
            meta: {
              ...metric.meta,
              [action.payload.meta]: action.payload.newValue,
            },
          };
        }

        // This should never happen.
        return metric;
      });

    case CHANGE_METRIC_ATTRIBUTE:
      return state.map(metric => {
        if (metric.id !== action.payload.metric.id) {
          return metric;
        }

        return {
          ...metric,
          [action.payload.attribute]: action.payload.newValue,
        };
      });

    default:
      return state;
  }
};
