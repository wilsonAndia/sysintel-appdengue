import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const mySchema = appSchema({
  version: 1, // Si en el futuro agregas tablas, cambias esto a 2
  tables: [
    tableSchema({
      name: 'houses',
      columns: [
        { name: 'neighborhood', type: 'string' },
        { name: 'street', type: 'string' },
        { name: 'number', type: 'string' },
        { name: 'complement', type: 'string', isOptional: true },
        { name: 'latitude', type: 'number' },
        { name: 'longitude', type: 'number' },
        { name: 'responsible', type: 'string' },
        { name: 'owner', type: 'boolean' },
        { name: 'subdomain', type: 'string', isOptional: true },
        { name: 'sector_id', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    // 2. TABLA PRINCIPAL DE INSPECCIONES
    tableSchema({
      name: 'inspections',
      columns: [
        { name: 'house_id', type: 'string', isIndexed: true }, // Relación con la casa
        { name: 'inspector_id', type: 'string', isIndexed: true }, // Relación con el usuario
        {
          name: 'group_visit_id',
          type: 'string',
          isOptional: true,
          isIndexed: true,
        },
        {
          name: 'agent_group_id',
          type: 'string',
          isOptional: true,
          isIndexed: true,
        },

        { name: 'number_of_adults', type: 'number' },
        { name: 'number_of_children', type: 'number' },
        { name: 'under_construction', type: 'boolean' },
        { name: 'construction_details', type: 'string', isOptional: true },
        { name: 'someone_at_home', type: 'boolean' },

        { name: 'latitude', type: 'number' },
        { name: 'longitude', type: 'number' },
        { name: 'start_time', type: 'number', isOptional: true },
        { name: 'end_time', type: 'number', isOptional: true },
        { name: 'inspection_date', type: 'number' },

        { name: 'has_pets', type: 'boolean' },
        { name: 'has_pool', type: 'boolean' },
        { name: 'has_dengue_foci', type: 'boolean' },
        { name: 'completed', type: 'boolean' },

        { name: 'neighbor1', type: 'string', isOptional: true },
        { name: 'neighbor2', type: 'string', isOptional: true },
        { name: 'neighbor3', type: 'string', isOptional: true },

        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // 3. SUB-TABLA: CARACTERÍSTICAS DEL INMUEBLE (PIVOTE)
    tableSchema({
      name: 'inspection_building_characteristics',
      columns: [
        { name: 'inspection_id', type: 'string', isIndexed: true },
        {
          name: 'building_characteristic_type_id',
          type: 'string',
          isIndexed: true,
        },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // 4. SUB-TABLA: MASCOTAS (PIVOTE)
    tableSchema({
      name: 'inspection_pets',
      columns: [
        { name: 'inspection_id', type: 'string', isIndexed: true },
        { name: 'pet_type_id', type: 'string', isIndexed: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // 5. SUB-TABLA: CONDICIONES DE PISCINA (PIVOTE)
    tableSchema({
      name: 'inspection_pool_conditions',
      columns: [
        { name: 'inspection_id', type: 'string', isIndexed: true },
        { name: 'pool_condition_type_id', type: 'string', isIndexed: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // 6. SUB-TABLA: MULTIMEDIA (FOTOS/VIDEOS)
    tableSchema({
      name: 'inspection_media',
      columns: [
        { name: 'inspection_id', type: 'string', isIndexed: true },
        { name: 'url', type: 'string' }, // Aquí guardaremos "file://..." offline y "https://..." online
        { name: 'type', type: 'string' }, // 'image' o 'video'
        { name: 'larvae_details', type: 'string', isOptional: true },
        { name: 'latitude', type: 'number', isOptional: true },
        { name: 'longitude', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});
