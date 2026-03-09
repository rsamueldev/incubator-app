import { createClient } from '@supabase/supabase-js';
import * as bcrypt from 'bcryptjs';

const supabaseUrl = 'https://vihzdeuxmnrvyqjucnng.supabase.co';
const supabaseKey = 'sb_publishable_0egDsKHKD0U_36UmoN0-Vg_5E0aArRB'; // Need the service_role key or we can just use the public one if RLS is off.
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const hash = await bcrypt.hash('secret123', 10);
    console.log('Hash length:', hash.length);
    console.log('Hash:', hash);

    const { data, error } = await supabase
        .from('User')
        .insert({
            user_id: '12345678-1234-1234-1234-123456789012',
            user_mail: 'test_length@test.com',
            user_name: 'Test Length',
            user_password: hash
        })
        .select()
        .maybeSingle();

    if (error) {
        console.error('Insert error:', error);
    } else {
        console.log('Insert success:', data);

        await supabase.from('User').delete().eq('user_id', '12345678-1234-1234-1234-123456789012');
    }
}

run();
