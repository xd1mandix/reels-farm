import type { Schema, Struct } from '@strapi/strapi';

export interface SharedCategoryList extends Struct.ComponentSchema {
  collectionName: 'components_shared_category_lists';
  info: {
    displayName: 'category-list';
    icon: 'apps';
  };
  attributes: {
    category: Schema.Attribute.String;
    series: Schema.Attribute.Component<'shared.series-list', true>;
  };
}

export interface SharedEpisodeLink extends Struct.ComponentSchema {
  collectionName: 'components_shared_episode_links';
  info: {
    displayName: 'episode-link';
    icon: 'attachment';
  };
  attributes: {
    episode: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
    link: Schema.Attribute.String;
    published: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    season: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
  };
}

export interface SharedSeriesList extends Struct.ComponentSchema {
  collectionName: 'components_shared_series_lists';
  info: {
    displayName: 'series-list';
    icon: 'bulletList';
  };
  attributes: {
    episodes: Schema.Attribute.Component<'shared.episode-link', true>;
    name: Schema.Attribute.String;
  };
}

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
      'shared.category-list': SharedCategoryList;
      'shared.episode-link': SharedEpisodeLink;
      'shared.series-list': SharedSeriesList;
      'shared.timecode': SharedTimecode;
    }
  }
}
