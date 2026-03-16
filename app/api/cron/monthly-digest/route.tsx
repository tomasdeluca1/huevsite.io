import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { render } from "@react-email/render";
import { MonthlyDigestEmail } from "@/components/emails/MonthlyDigestEmail";
import { BLOG_POSTS } from "@/lib/blog-data";
import React from "react";

export const dynamic = "force-dynamic";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Monthly Digest Cron Job
 * Runs on the 1st of every month to:
 * 1. Highlight all weekly winners of the previous month.
 * 2. Showcase Top 3 Builders by Score.
 * 3. Showcase new features/blog posts.
 * 4. Send community stats.
 */
export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get("authorization");
        const { searchParams } = new URL(request.url);
        const secret = searchParams.get("secret");
        const forceMonth = searchParams.get("month"); // Format: YYYY-MM (optional for manual trigger)
        const testEmail = searchParams.get("test_email"); // Special test email

        // Auth Check
        const isCron = process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`;
        const isAdminSecret = secret && secret === process.env.ADMIN_SECRET;

        if (!isCron && !isAdminSecret) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabase = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // -- 1. Determine the Month --
        let targetMonthDate: Date;
        if (forceMonth) {
            const [y, m] = forceMonth.split("-").map(Number);
            targetMonthDate = new Date(y, m - 1, 1);
        } else {
            // Default to PREVIOUS month (since cron runs on the 1st)
            const now = new Date();
            targetMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        }

        const monthStr = `${targetMonthDate.getFullYear()}-${String(targetMonthDate.getMonth() + 1).padStart(2, '0')}`;
        const monthName = targetMonthDate.toLocaleString('es-ES', { month: 'long' });
        const capitalizedMonthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);
        const displayMonth = `${capitalizedMonthName} ${targetMonthDate.getFullYear()}`;

        // -- 2. Fetch Weekly Winners of that Month --
        const startOfMonth = new Date(targetMonthDate.getFullYear(), targetMonthDate.getMonth(), 1);
        const endOfMonth = new Date(targetMonthDate.getFullYear(), targetMonthDate.getMonth() + 1, 0, 23, 59, 59);

        const { data: winnersData, error: winnersError } = await supabase
            .from("showcase_winners")
            .select(`
                week,
                user_id,
                user:profiles ( id, username, name, image )
            `)
            .gte("created_at", startOfMonth.toISOString())
            .lte("created_at", endOfMonth.toISOString())
            .order("created_at", { ascending: true });

        if (winnersError) throw winnersError;

        const weeklyWinners = (winnersData || []).map(w => ({
            week: w.week,
            name: (w.user as any)?.name || (w.user as any)?.username || "Builder",
            username: (w.user as any)?.username || "builder",
            avatarUrl: (w.user as any)?.image,
        }));

        // -- 3. Fetch Nominations for Stats --
        const { data: nominations, error: nomError } = await supabase
            .from("showcase_nominations")
            .select("user_id")
            .gte("created_at", startOfMonth.toISOString())
            .lte("created_at", endOfMonth.toISOString());

        if (nomError) throw nomError;

        // -- 4. Fetch Top 3 Scores del Mes --
        const { data: topBuildersData } = await supabase
            .from("profiles")
            .select("name, username, image, builder_score")
            .order("builder_score", { ascending: false })
            .limit(3);

        const topBuilders = (topBuildersData || []).map(b => ({
            name: b.name || b.username,
            username: b.username,
            avatarUrl: b.image,
            score: b.builder_score || 0
        }));

        // -- 5. Get New Features (Dynamic) --
        const featuredPosts = BLOG_POSTS
            .filter(post => {
                const postDate = new Date(post.date);
                return postDate.getMonth() === targetMonthDate.getMonth() && 
                       postDate.getFullYear() === targetMonthDate.getFullYear();
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 3); 

        // -- 6. Get Community Stats --
        const { count: newBuildersCount } = await supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .gte("created_at", startOfMonth.toISOString())
            .lte("created_at", endOfMonth.toISOString());

        const stats = {
            totalBuilders: newBuildersCount || 0,
            totalNominations: nominations?.length || 0,
        };

        // -- 7. Fetch All Users and Send Emails --
        const emailResults: { email: string; sent: boolean; error?: string }[] = [];
        let usersToNotify: { email?: string }[] = [];

        if (testEmail) {
            usersToNotify = [{ email: testEmail }];
        } else {
            const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
            if (authError) throw authError;
            usersToNotify = users;
        }

        // Generate the HTML once
        const emailHtml = await render(
            React.createElement(MonthlyDigestEmail, {
                monthName: displayMonth,
                topBuilders,
                weeklyWinners,
                features: featuredPosts.map(p => ({
                    title: p.title,
                    excerpt: p.excerpt,
                    slug: p.slug
                })),
                stats
            })
        );

        // Send to each user sequentially with a small delay
        for (const user of usersToNotify) {
            if (!user.email) continue;

            try {
                await resend.emails.send({
                    from: "hi@huevsite.studio",
                    to: user.email,
                    subject: `📊 Huevsite Digest: Lo mejor de ${capitalizedMonthName}`,
                    html: emailHtml,
                });
                emailResults.push({ email: user.email, sent: true });
                
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (err: any) {
                emailResults.push({ email: user.email, sent: false, error: err?.message });
            }
        }

        return NextResponse.json({
            success: true,
            month: monthStr,
            buildersCount: weeklyWinners.length,
            topScore: topBuilders[0]?.username,
            emailsSent: emailResults.filter(r => r.sent).length,
            errors: emailResults.filter(r => !r.sent)
        });

    } catch (error: any) {
        console.error("Monthly digest error:", error);
        return NextResponse.json({ error: error.message || "Algo salió mal." }, { status: 500 });
    }
}
