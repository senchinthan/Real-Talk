import Agent from "@/components/Agent";
import { getCurrentUser } from "@/lib/actions/auth.action";

const Page = async () => {
    const user = await getCurrentUser();

    return (
        <div className="pt-16"> {/* Added padding-top to ensure content is below the floating menu */}
            <h3 className="text-xl font-semibold">Interview generation</h3>

            <Agent
                userName={user?.name!}
                userId={user?.id}
                type="generate"
                interviewId="generate" // Adding required interviewId prop
            />
        </div>
    );
};

export default Page;
