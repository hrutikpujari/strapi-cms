import type { Schema, Struct } from '@strapi/strapi';

export interface SharedSocialLinks extends Struct.ComponentSchema {
  collectionName: 'components_shared_social_links';
  info: {
    description: 'Social media profile URLs';
    displayName: 'Social Links';
    icon: 'link';
  };
  attributes: {
    github: Schema.Attribute.String;
    instagram: Schema.Attribute.String;
    linkedin: Schema.Attribute.String;
    twitter: Schema.Attribute.String;
    website: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export namespace Public {
    export interface ComponentSchemas {
      'shared.social-links': SharedSocialLinks;
    }
  }
}
