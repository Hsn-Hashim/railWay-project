const supabaseUrl = 'https://mulbvyywnrlqlqvgjtzp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11bGJ2eXl3bnJscWxxdmdqdHpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NDE1MjQsImV4cCI6MjA5MjAxNzUyNH0.IeS8h8ptvZJoFU_pR7JuCQooAp4lxw2TFTwn7zZV8Uc';

// غيرنا الاسم هنا إلى supabaseClient لفك التعارض
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

document.getElementById('signUpForm').addEventListener('submit', async function(event) {
    event.preventDefault(); 
    
    console.log("1. جاري إرسال البيانات...");

    const nameInput = document.getElementById('reg-name').value;
    const nationalIdInput = document.getElementById('reg-national-id').value;
    const phoneInput = document.getElementById('reg-phone').value;
    const dobInput = document.getElementById('reg-dob').value;
    const emailInput = document.getElementById('reg-email').value;
    const passInput = document.getElementById('reg-pass').value;

    // استخدمنا supabaseClient بدل supabase
    const { data: authData, error: authError } = await supabaseClient.auth.signUp({
        email: emailInput,
        password: passInput,
        options: {
            data: { full_name: nameInput }
        }
    });

    if (authError) {
        console.error("مشكلة في نظام Auth:", authError);
        alert("خطأ: " + authError.message);
        return;
    }

    if (!authData || !authData.user) {
        alert("هذا الإيميل مسجل مسبقاً، جرب إيميل جديد.");
        return;
    }

    const newUserId = authData.user.id;
    console.log("2. تم فتح حساب بنجاح، ID المسافر:", newUserId);

    // استخدمنا supabaseClient بدل supabase
    const { error: dbError } = await supabaseClient
        .from('user') 
        .update({
            national_id: nationalIdInput,
            phone: phoneInput,
            bDate: dobInput 
        })
        .eq('id', newUserId);

    if (dbError) {
        console.error("مشكلة في تحديث الجدول:", dbError);
        alert("تم إنشاء الحساب لكن فشل حفظ البيانات: " + dbError.message);
        return;
    }

    console.log("3. اكتملت العملية!");
    alert("تم إنشاء الحساب بنجاح!");
    window.location.href = "sign-in.html";
});