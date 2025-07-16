import React from 'react';
import RegisterForm from '../components/RegisterForm';

function RegisterPage() {
    useEffect(() => {
        document.title = 'Chat Portfolio';
    }, []);
    return (
        <div>
            <RegisterForm />
        </div>
    );
}

export default RegisterPage;
