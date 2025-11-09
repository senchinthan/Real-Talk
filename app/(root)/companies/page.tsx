import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getCompanyTemplates } from '@/lib/actions/company.action';
import { getCurrentUser } from '@/lib/actions/auth.action';
import { Building2, Clock, Users, Star } from 'lucide-react';

const CompaniesPage = async () => {
  const user = await getCurrentUser();
  const isAdmin = user?.isAdmin || user?.role === 'admin' || false;
  const templates = await getCompanyTemplates(isAdmin);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Building2 className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Company Interview Templates</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-3xl">
          Practice with real interview processes from top tech companies. Each template includes multiple rounds 
          that reflect the actual hiring process at these companies.
        </p>
        <Separator className="mt-6" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] group">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center ring-2 ring-muted group-hover:ring-primary/20 transition-all">
                  <Image
                    src={template.companyLogo}
                    alt={`${template.companyName} logo`}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    {template.companyName}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {template.rounds.length} rounds
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <CardDescription className="line-clamp-2">
                {template.description}
              </CardDescription>

              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Rounds included:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {template.rounds.map((round) => (
                    <Badge key={round.id} variant="secondary" className="text-xs">
                      {round.name}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {template.rounds.reduce((total, round) => total + round.duration, 0)} min
                </div>
                <Button asChild className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Link href={`/companies/${template.id}`}>
                    Start Interview
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Templates Available</h3>
            <p className="text-muted-foreground">No company templates available at the moment.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CompaniesPage;
