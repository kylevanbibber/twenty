import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { type FieldDefinition } from '@/object-record/record-field/ui/types/FieldDefinition';
import { type FieldMetadata } from '@/object-record/record-field/ui/types/FieldMetadata';
import {
  getMultiEditFieldInputName,
  normalizeMultiEditValue,
} from '@/object-record/record-update-multiple/utils/getMultiEditUpdateInput';
import { FieldMetadataType } from 'twenty-shared/types';

describe('normalizeMultiEditValue', () => {
  it('should keep an explicit null as a clear', () => {
    expect(normalizeMultiEditValue(null)).toBeNull();
  });

  it('should treat empty values as no-change (undefined)', () => {
    expect(normalizeMultiEditValue('')).toBeUndefined();
    expect(normalizeMultiEditValue([])).toBeUndefined();
    expect(normalizeMultiEditValue(undefined)).toBeUndefined();
  });

  it('should pass through a non-empty value', () => {
    expect(normalizeMultiEditValue('WON')).toBe('WON');
    expect(normalizeMultiEditValue(42)).toBe(42);
    expect(normalizeMultiEditValue(['A', 'B'])).toEqual(['A', 'B']);
  });
});

describe('getMultiEditFieldInputName', () => {
  it('should use the field name for a non-relation field', () => {
    const fieldMetadataItem = {
      type: FieldMetadataType.TEXT,
      name: 'stage',
    } as FieldMetadataItem;

    const fieldDefinition = {
      type: FieldMetadataType.TEXT,
      metadata: { fieldName: 'stage' },
    } as FieldDefinition<FieldMetadata>;

    expect(
      getMultiEditFieldInputName({ fieldMetadataItem, fieldDefinition }),
    ).toBe('stage');
  });

  it('should use the join column name for a relation field', () => {
    const fieldMetadataItem = {
      type: FieldMetadataType.RELATION,
      name: 'company',
    } as FieldMetadataItem;

    const fieldDefinition = {
      type: FieldMetadataType.RELATION,
      metadata: { fieldName: 'company' },
    } as FieldDefinition<FieldMetadata>;

    expect(
      getMultiEditFieldInputName({ fieldMetadataItem, fieldDefinition }),
    ).toBe('companyId');
  });
});
