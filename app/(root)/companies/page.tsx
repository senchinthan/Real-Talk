import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { getCompanyTemplates } from '@/lib/actions/company.action';

const CompaniesPage = async () => {
  const templates = await getCompanyTemplates();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Company Interview Templates</h1>
        <p className="text-lg text-muted-foreground">
          Practice with real interview processes from top tech companies. Each template includes multiple rounds 
          that reflect the actual hiring process at these companies.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="card-border p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <Image
                  src={template.companyLogo}
                  alt={`${template.companyName} logo`}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              </div>
              <div>
                <h3 className="text-xl font-semibold">{template.companyName}</h3>
                <p className="text-sm text-muted-foreground">{template.rounds.length} rounds</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {template.description}
            </p>

            <div className="mb-4">
              <h4 className="font-medium mb-2">Rounds included:</h4>
              <div className="flex flex-wrap gap-2">
                {template.rounds.map((round) => (
                  <span
                    key={round.id}
                    className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                  >
                    {round.name}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Duration: {template.rounds.reduce((total, round) => total + round.duration, 0)} min
              </div>
              <Button asChild className="btn-primary">
                <Link href={`/companies/${template.id}`}>
                  Start Interview
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No company templates available at the moment.</p>
        </div>
      )}
    </div>
  );
};

export default CompaniesPage;
