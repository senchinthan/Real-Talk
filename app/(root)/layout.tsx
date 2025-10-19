import { ReactNode } from 'react'
import {isAuthenticated} from "@/lib/actions/auth.action";
import {redirect} from "next/navigation";
import NavMenu from "@/components/NavMenu";
import { Card } from "@/components/ui/card";

const Layout = async ({children}: {children: ReactNode} ) => {
    const isUserAuthenticated = await isAuthenticated();
    if (!isUserAuthenticated) redirect("/sign-in");

    return (
        <div className="min-h-screen bg-background">
            <nav className="fixed top-4 left-4 z-50">
                <NavMenu />
            </nav>

            <main className="container mx-auto px-4 py-8">
                {children}
            </main>
        </div>
    )
}
export default Layout
