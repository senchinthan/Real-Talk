import Agent from "@/components/Agent";
import { getCurrentUser } from "@/lib/actions/auth.action";

const Page = async () => {
    const user = await getCurrentUser();
    
    console.log('Interview generation page - user data:', { 
        userId: user?.id, 
        userName: user?.name,
        userEmail: user?.email 
    });

    return (
        <>
            <h3>Interview generation</h3>

            <Agent
                userName={user?.name!}
                userId={user?.id}
                type="generate"
            />
        </>
    );
};

export default Page;
