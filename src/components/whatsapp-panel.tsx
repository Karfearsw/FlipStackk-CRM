import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Phone, 
  Send, 
  MessageSquare, 
  Users, 
  Settings,
  RefreshCw,
  Plus,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WhatsAppContact {
  phone: string;
  name: string;
  about?: string;
  tags?: string[];
  crmLead?: {
    id: number;
    name: string;
    status: string;
    propertyAddress: string;
    lastContact: Date;
  };
}

interface WhatsAppTemplate {
  id: string;
  name: string;
  category: 'UTILITY' | 'MARKETING' | 'AUTHENTICATION';
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  language: string;
  components: any[];
}

interface WhatsAppConfig {
  phoneNumberId: string;
  displayName: string;
  phoneNumber: string;
  isActive: boolean;
}

export function WhatsAppPanel() {
  const { toast } = useToast();
  const [contacts, setContacts] = useState<WhatsAppContact[]>([]);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [config, setConfig] = useState<WhatsAppConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [selectedContact, setSelectedContact] = useState<WhatsAppContact | null>(null);
  const [messageText, setMessageText] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null);

  // Load WhatsApp data
  useEffect(() => {
    loadWhatsAppData();
  }, []);

  const loadWhatsAppData = async () => {
    try {
      setLoading(true);
      
      // Load configuration
      const configResponse = await fetch('/api/whatsapp/config');
      if (configResponse.ok) {
        const configData = await configResponse.json();
        setConfig(configData.config);
      }

      // Load contacts
      const contactsResponse = await fetch('/api/whatsapp/contacts/sync');
      if (contactsResponse.ok) {
        const contactsData = await contactsResponse.json();
        setContacts(contactsData.contacts || []);
      }

      // Load templates
      const templatesResponse = await fetch('/api/whatsapp/templates');
      if (templatesResponse.ok) {
        const templatesData = await templatesResponse.json();
        setTemplates(templatesData.templates || []);
      }
    } catch (error) {
      console.error('Error loading WhatsApp data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load WhatsApp data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const syncContacts = async () => {
    if (!config) return;

    try {
      setSyncing(true);
      const response = await fetch('/api/whatsapp/contacts/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumberId: config.phoneNumberId,
          syncMode: 'bidirectional'
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Success',
          description: `Synced ${data.results.syncedContacts} contacts`
        });
        loadWhatsAppData(); // Reload data
      } else {
        throw new Error('Sync failed');
      }
    } catch (error) {
      console.error('Error syncing contacts:', error);
      toast({
        title: 'Error',
        description: 'Failed to sync contacts',
        variant: 'destructive'
      });
    } finally {
      setSyncing(false);
    }
  };

  const sendMessage = async () => {
    if (!selectedContact || !messageText.trim()) return;

    try {
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: selectedContact.phone,
          message: messageText,
          type: 'text'
        })
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Message sent successfully'
        });
        setMessageText('');
      } else {
        throw new Error('Send failed');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      });
    }
  };

  const sendTemplate = async (template: WhatsAppTemplate) => {
    if (!selectedContact) return;

    try {
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: selectedContact.phone,
          template: template.name,
          type: 'template'
        })
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Template sent successfully'
        });
      } else {
        throw new Error('Send failed');
      }
    } catch (error) {
      console.error('Error sending template:', error);
      toast({
        title: 'Error',
        description: 'Failed to send template',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!config) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center h-64 space-y-4">
          <AlertCircle className="h-12 w-12 text-yellow-500" />
          <h3 className="text-lg font-semibold">WhatsApp Not Configured</h3>
          <p className="text-muted-foreground text-center max-w-md">
            WhatsApp Business API is not configured. Please set up your WhatsApp Business account to start messaging.
          </p>
          <Button>
            <Settings className="h-4 w-4 mr-2" />
            Configure WhatsApp
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Configuration Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                WhatsApp Business
              </CardTitle>
              <CardDescription>
                {config.displayName} ({config.phoneNumber})
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={config.isActive ? 'default' : 'secondary'}>
                {config.isActive ? 'Active' : 'Inactive'}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={syncContacts}
                disabled={syncing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                Sync Contacts
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="contacts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="contacts" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Contacts ({contacts.length})
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Templates ({templates.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contacts" className="space-y-4">
          <div className="grid gap-4">
            {contacts.map((contact) => (
              <Card key={contact.phone}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{contact.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {contact.phone}
                        </Badge>
                      </div>
                      {contact.about && (
                        <p className="text-sm text-muted-foreground">{contact.about}</p>
                      )}
                      {contact.crmLead && (
                        <div className="flex items-center gap-2 text-sm">
                          <Badge variant="secondary" className="text-xs">
                            {contact.crmLead.status}
                          </Badge>
                          <span className="text-muted-foreground">
                            {contact.crmLead.propertyAddress}
                          </span>
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant={selectedContact?.phone === contact.phone ? 'secondary' : 'outline'}
                      onClick={() => setSelectedContact(contact)}
                    >
                      {selectedContact?.phone === contact.phone ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <MessageSquare className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedContact && (
            <Card>
              <CardHeader>
                <CardTitle>Message {selectedContact.name}</CardTitle>
                <CardDescription>
                  Send a WhatsApp message to {selectedContact.phone}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type your message here..."
                    rows={4}
                  />
                </div>
                <Button onClick={sendMessage} className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{template.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {template.category}
                        </Badge>
                        <Badge 
                          variant={template.status === 'APPROVED' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {template.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Language: {template.language}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {template.status === 'APPROVED' && selectedContact && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => sendTemplate(template)}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Send
                        </Button>
                      )}
                      <Button size="sm" variant="ghost">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-center">
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}