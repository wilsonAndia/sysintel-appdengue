import {appSchema, tableSchema} from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'houses',
      columns: [
        {name: 'neighborhood', type: 'string'},
        {name: 'street', type: 'string'},
        {name: 'number', type: 'string'},
        {name: 'complement', type: 'string', isOptional: true},
        {name: 'latitude', type: 'number'},
        {name: 'longitude', type: 'number'},
        {name: 'responsible', type: 'string'},
        {name: 'subdomain_name', type: 'string', isOptional: true},
        {name: 'sync_status', type: 'string'},
        {name: 'updated_at', type: 'number'}, // timestamp local
        {name: 'deleted_at', type: 'number', isOptional: true},
      ],
    }),

    tableSchema({
      name: 'inspections',
      columns: [
        {name: 'house_id', type: 'string', isIndexed: true},
        {name: 'latitude', type: 'number'},
        {name: 'longitude', type: 'number'},
        {name: 'number_of_adults', type: 'number'},
        {name: 'number_of_children', type: 'number'},
        {name: 'someone_at_home', type: 'boolean'},
        {name: 'under_construction', type: 'boolean'},
        {name: 'construction_details', type: 'string', isOptional: true},
        {name: 'has_pets', type: 'boolean'},
        {name: 'has_pool', type: 'boolean'},
        {name: 'has_dengue_foci', type: 'boolean'},
        {name: 'neighbor1', type: 'string', isOptional: true},
        {name: 'neighbor2', type: 'string', isOptional: true},
        {name: 'neighbor3', type: 'string', isOptional: true},
        {name: 'completed', type: 'boolean'},
        {name: 'start_time', type: 'number', isOptional: true},
        {name: 'end_time', type: 'number', isOptional: true},
        {name: 'inspector_id', type: 'string', isOptional: true},
        {name: 'group_visit_id', type: 'string', isOptional: true},
        {name: 'sync_status', type: 'string'},
        {name: 'updated_at', type: 'number'},
        {name: 'deleted_at', type: 'number', isOptional: true},
      ],
    }),
  ],
});
