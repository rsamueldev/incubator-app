
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function testInsert() {
    const deviceId = '777cec09-f5ca-4af4-8082-d8047aed6041';
    console.log('--- TESTING INSERT INTO READING ---');
    const { data, error } = await supabase
        .from('Reading')
        .insert({
            device_id: deviceId,
            temperature: 35.5,
            humidity: 50.0
        })
        .select();

    if (error) console.error('Insert Error:', error);
    else console.log('Insert Success:', data);
}

testInsert();
