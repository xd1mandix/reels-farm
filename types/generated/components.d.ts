import type { Schema, Struct } from '@strapi/strapi';

export interface SharedTimecode extends Struct.ComponentSchema {
  collectionName: 'components_shared_timecodes';
  info: {
    displayName: 'timecode';
  };
  attributes: {
    MM: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 120;
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    SS: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 59;
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
  };
}

declare module '@strapi/strapi' {
  export namespace Public {
    export interface ComponentSchemas {
      'shared.timecode': SharedTimecode;
    }
  }
}
