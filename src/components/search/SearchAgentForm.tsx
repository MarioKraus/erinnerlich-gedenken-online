import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Bell, Plus, X, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Filter {
  type: 'name' | 'location';
  value: string;
}

interface FilterGroup {
  filters: Filter[];
  logic: 'AND' | 'OR';
}

const SearchAgentForm = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [agentName, setAgentName] = useState("");
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([
    { filters: [{ type: 'name', value: '' }], logic: 'AND' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [groupLogic, setGroupLogic] = useState<'AND' | 'OR'>('OR');

  const addFilter = (groupIndex: number) => {
    const newGroups = [...filterGroups];
    newGroups[groupIndex].filters.push({ type: 'name', value: '' });
    setFilterGroups(newGroups);
  };

  const removeFilter = (groupIndex: number, filterIndex: number) => {
    const newGroups = [...filterGroups];
    if (newGroups[groupIndex].filters.length > 1) {
      newGroups[groupIndex].filters.splice(filterIndex, 1);
      setFilterGroups(newGroups);
    }
  };

  const updateFilter = (groupIndex: number, filterIndex: number, field: 'type' | 'value', value: string) => {
    const newGroups = [...filterGroups];
    newGroups[groupIndex].filters[filterIndex][field] = value as any;
    setFilterGroups(newGroups);
  };

  const updateGroupLogic = (groupIndex: number, logic: 'AND' | 'OR') => {
    const newGroups = [...filterGroups];
    newGroups[groupIndex].logic = logic;
    setFilterGroups(newGroups);
  };

  const addFilterGroup = () => {
    setFilterGroups([...filterGroups, { filters: [{ type: 'name', value: '' }], logic: 'AND' }]);
  };

  const removeFilterGroup = (groupIndex: number) => {
    if (filterGroups.length > 1) {
      const newGroups = [...filterGroups];
      newGroups.splice(groupIndex, 1);
      setFilterGroups(newGroups);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "E-Mail erforderlich",
        description: "Bitte geben Sie Ihre E-Mail-Adresse ein.",
        variant: "destructive",
      });
      return;
    }

    const hasValidFilter = filterGroups.some(group => 
      group.filters.some(filter => filter.value.trim())
    );

    if (!hasValidFilter) {
      toast({
        title: "Filter erforderlich",
        description: "Bitte geben Sie mindestens einen Suchbegriff ein.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create the search agent
      const { data: agent, error: agentError } = await supabase
        .from("search_agents")
        .insert({
          email,
          name: agentName || `Suchagent für ${email}`,
        })
        .select()
        .single();

      if (agentError) throw agentError;

      // Create filter groups and filters
      for (const group of filterGroups) {
        const { data: filterGroup, error: groupError } = await supabase
          .from("search_agent_filter_groups")
          .insert({
            agent_id: agent.id,
            logic_operator: group.logic,
          })
          .select()
          .single();

        if (groupError) throw groupError;

        // Insert filters
        for (const filter of group.filters) {
          if (filter.value.trim()) {
            const { error: filterError } = await supabase
              .from("search_agent_filters")
              .insert({
                agent_id: agent.id,
                filter_type: filter.type,
                filter_value: filter.value.trim(),
              });

            if (filterError) throw filterError;
          }
        }
      }

      toast({
        title: "Suchagent erstellt",
        description: "Sie werden benachrichtigt, wenn neue Traueranzeigen Ihren Kriterien entsprechen.",
      });

      // Reset form
      setEmail("");
      setAgentName("");
      setFilterGroups([{ filters: [{ type: 'name', value: '' }], logic: 'AND' }]);

    } catch (error) {
      console.error("Error creating search agent:", error);
      toast({
        title: "Fehler",
        description: "Der Suchagent konnte nicht erstellt werden. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="memorial-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-memorial-forest" />
          <CardTitle className="font-serif">Suchagent einrichten</CardTitle>
        </div>
        <CardDescription>
          Erhalten Sie eine E-Mail-Benachrichtigung, wenn neue Traueranzeigen Ihren Kriterien entsprechen.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              E-Mail-Adresse
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="ihre@email.de"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Optional Name */}
          <div className="space-y-2">
            <Label htmlFor="agentName">Name des Suchagenten (optional)</Label>
            <Input
              id="agentName"
              type="text"
              placeholder="z.B. Familie Müller in Hamburg"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
            />
          </div>

          {/* Filter Groups */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Suchkriterien</Label>
              {filterGroups.length > 1 && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Gruppen verknüpfen mit:</span>
                  <Select value={groupLogic} onValueChange={(v) => setGroupLogic(v as 'AND' | 'OR')}>
                    <SelectTrigger className="w-20 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AND">UND</SelectItem>
                      <SelectItem value="OR">ODER</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {filterGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="border rounded-lg p-4 space-y-3 bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Gruppe {groupIndex + 1}</Badge>
                    {group.filters.length > 1 && (
                      <Select 
                        value={group.logic} 
                        onValueChange={(v) => updateGroupLogic(groupIndex, v as 'AND' | 'OR')}
                      >
                        <SelectTrigger className="w-24 h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AND">UND</SelectItem>
                          <SelectItem value="OR">ODER</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  {filterGroups.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFilterGroup(groupIndex)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {group.filters.map((filter, filterIndex) => (
                  <div key={filterIndex} className="flex items-center gap-2">
                    <Select 
                      value={filter.type} 
                      onValueChange={(v) => updateFilter(groupIndex, filterIndex, 'type', v)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Nachname</SelectItem>
                        <SelectItem value="location">Ort</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder={filter.type === 'name' ? "z.B. Müller" : "z.B. Hamburg"}
                      value={filter.value}
                      onChange={(e) => updateFilter(groupIndex, filterIndex, 'value', e.target.value)}
                      className="flex-1"
                    />
                    {group.filters.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFilter(groupIndex, filterIndex)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addFilter(groupIndex)}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Filter hinzufügen
                </Button>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={addFilterGroup}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Neue Filtergruppe hinzufügen
            </Button>
          </div>

          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-memorial-forest hover:bg-memorial-forest/90"
          >
            {isSubmitting ? "Wird erstellt..." : "Suchagent aktivieren"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SearchAgentForm;