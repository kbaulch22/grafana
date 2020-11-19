import { reducerTester } from 'test/core/redux/reducerTester';
import { defaultBucketAgg } from '../../../query_def';
import { changeMetricType } from '../../MetricAggregationsEditor/state/actions';
import { BucketAggregation, DateHistogram } from '../aggregations';
import {
  addBucketAggregation,
  changeBucketAggregationField,
  changeBucketAggregationSetting,
  changeBucketAggregationType,
  removeBucketAggregation,
} from './actions';
import { reducer } from './reducer';

describe('Bucket Aggregations Reducer', () => {
  it('Should correctly add new aggregations', () => {
    reducerTester()
      .givenReducer(reducer, [])
      .whenActionIsDispatched(addBucketAggregation())
      .thenStateShouldEqual([defaultBucketAgg('1')])
      .whenActionIsDispatched(addBucketAggregation())
      .thenStateShouldEqual([defaultBucketAgg('1'), defaultBucketAgg('2')]);
  });

  it('Should correctly remove aggregations', () => {
    const firstAggregation: BucketAggregation = {
      id: '1',
      type: 'date_histogram',
    };

    const secondAggregation: BucketAggregation = {
      id: '2',
      type: 'date_histogram',
    };

    reducerTester()
      .givenReducer(reducer, [firstAggregation, secondAggregation])
      .whenActionIsDispatched(removeBucketAggregation(firstAggregation.id))
      .thenStateShouldEqual([secondAggregation]);
  });

  it("Should correctly change aggregation's type", () => {
    const firstAggregation: BucketAggregation = {
      id: '1',
      type: 'date_histogram',
    };
    const secondAggregation: BucketAggregation = {
      id: '2',
      type: 'date_histogram',
    };

    const expectedSecondAggregation: BucketAggregation = { ...secondAggregation, type: 'histogram' };

    reducerTester()
      .givenReducer(reducer, [firstAggregation, secondAggregation])
      .whenActionIsDispatched(changeBucketAggregationType(secondAggregation.id, expectedSecondAggregation.type))
      .thenStateShouldEqual([firstAggregation, { ...secondAggregation, type: expectedSecondAggregation.type }]);
  });

  it("Should correctly change aggregation's field", () => {
    const firstAggregation: BucketAggregation = {
      id: '1',
      type: 'date_histogram',
    };
    const secondAggregation: BucketAggregation = {
      id: '2',
      type: 'date_histogram',
    };

    const expectedSecondAggregation = {
      ...secondAggregation,
      field: 'new field',
    };

    reducerTester()
      .givenReducer(reducer, [firstAggregation, secondAggregation])
      .whenActionIsDispatched(changeBucketAggregationField(secondAggregation.id, expectedSecondAggregation.field))
      .thenStateShouldEqual([firstAggregation, expectedSecondAggregation]);
  });

  describe("When changing a metric aggregation's type", () => {
    it('Should remove and restore bucket aggregations correctly', () => {
      const initialState: BucketAggregation[] = [
        {
          id: '1',
          type: 'date_histogram',
        },
      ];

      reducerTester()
        .givenReducer(reducer, initialState)
        // If the new metric aggregation is `isSingleMetric` we should remove all bucket aggregations.
        .whenActionIsDispatched(changeMetricType('Some id', 'raw_data'))
        .thenStatePredicateShouldEqual((newState: BucketAggregation[]) => newState.length === 0)
        // Switching back to another aggregation that is NOT `isSingleMetric` should bring back a bucket aggregation
        .whenActionIsDispatched(changeMetricType('Some id', 'max'))
        .thenStatePredicateShouldEqual((newState: BucketAggregation[]) => newState.length === 1)
        // When none of the above is true state shouldn't change.
        .whenActionIsDispatched(changeMetricType('Some id', 'min'))
        .thenStatePredicateShouldEqual((newState: BucketAggregation[]) => newState.length === 1);
    });
  });

  it("Should correctly change aggregation's settings", () => {
    const firstAggregation: DateHistogram = {
      id: '1',
      type: 'date_histogram',
      settings: {
        min_doc_count: '0',
      },
    };
    const secondAggregation: DateHistogram = {
      id: '2',
      type: 'date_histogram',
    };

    const expectedSettings: typeof firstAggregation['settings'] = {
      min_doc_count: '1',
    };

    reducerTester()
      .givenReducer(reducer, [firstAggregation, secondAggregation])
      .whenActionIsDispatched(
        changeBucketAggregationSetting(firstAggregation, 'min_doc_count', expectedSettings.min_doc_count!)
      )
      .thenStateShouldEqual([{ ...firstAggregation, settings: expectedSettings }, secondAggregation]);
  });
});
