"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Proctoring, integrations (simulated)</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold">Proctoring</h3>
          <p className="text-sm text-muted-foreground mt-1">Enable/disable proctoring features</p>
          <div className="mt-4 flex gap-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked />
              Proctoring enabled
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold">Integrations</h3>
          <p className="text-sm text-muted-foreground mt-1">SIS, SSO toggles (simulated)</p>
          <div className="mt-4 space-y-2">
            <Button variant="outline" disabled>SIS Sync</Button>
            <Button variant="outline" disabled>SSO / SAML</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
