import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vihzdeuxmnrvyqjucnng.supabase.co';
const supabaseKey = 'sb_publishable_0egDsKHKD0U_36UmoN0-Vg_5E0aArRB'; // Anon key
const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogin() {
    console.log('Intentando iniciar sesión...');

    // Cambia estas credenciales por las del usuario que acabas de intentar registrar y verificar
    // ESTO ES SOLO PARA PRUEBAS LOCALES, NO LO DEJAREMOS ASÍ
    const testEmail = 'tu_correo_de_prueba@gmail.com'; // REEMPLAZAR CON CORREO REAL
    const testPassword = 'tu_password_de_prueba'; // REEMPLAZAR CON PASSWORD REAL

    const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
    });

    if (error) {
        console.error('Login falló:', error.message);
        console.log('Detalles completos del error:', error);
    } else {
        console.log('Login exitoso!');
        console.log('User ID:', data.user?.id);
        console.log('Email confirmed at:', data.user?.email_confirmed_at);
    }
}

testLogin();
