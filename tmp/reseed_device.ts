import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar variables de entorno desde el .env del proyecto
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: No se encontraron SUPABASE_URL o SUPABASE_KEY en el .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function reseed() {
    const deviceId = '777cec09-f5ca-4af4-8082-d8047aed6041';

    console.log(`\n🔄 Intentando registrar dispositivo: ${deviceId}`);

    const { data, error } = await supabase
        .from('Device')
        .upsert({
            device_id: deviceId,
            device_name: 'Incubadora Principal',
            mode: 1 // Gallina por defecto
        })
        .select();

    if (error) {
        console.error('❌ Error al insertar dispositivo:', error.message);
    } else {
        console.log('✅ Dispositivo registrado con éxito en la base de datos!');
        console.log(data);
    }
}

reseed();
