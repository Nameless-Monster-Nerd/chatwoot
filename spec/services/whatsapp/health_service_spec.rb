require 'rails_helper'

RSpec.describe Whatsapp::HealthService do
  subject(:service) { described_class.new(whatsapp_channel) }

  let(:provider_config) do
    {
      'api_key' => 'synthetic_access_token',
      'business_account_id' => 'synthetic_business_account_id',
      'phone_number_id' => 'synthetic_phone_number_id',
      'source' => 'embedded_signup'
    }
  end
  let(:whatsapp_channel) do
    create(
      :channel_whatsapp,
      provider: 'whatsapp_cloud',
      provider_config: provider_config,
      sync_templates: false,
      validate_provider_config: false
    )
  end
  let(:health_url) { 'https://graph.facebook.com/v22.0/synthetic_phone_number_id' }
  let(:response_headers) { { 'Content-Type' => 'application/json' } }

  before do
    whatsapp_channel.update!(provider_config: provider_config)
  end

  describe '#fetch_health_status' do
    it 'records an authorization error when Meta returns OAuth error 190' do
      stub_request(:get, /#{Regexp.escape(health_url)}/)
        .to_return(
          status: 400,
          headers: response_headers,
          body: {
            error: {
              message: 'Error validating access token',
              type: 'OAuthException',
              code: 190,
              error_subcode: 464,
              fbtrace_id: 'synthetic_trace_id'
            }
          }.to_json
        )

      expect { service.fetch_health_status }.to raise_error(CustomExceptions::Whatsapp::AuthorizationError)
      expect(whatsapp_channel.authorization_error_count).to eq(1)
    end

    it 'does not record an authorization error for other API failures' do
      stub_request(:get, /#{Regexp.escape(health_url)}/)
        .to_return(
          status: 400,
          headers: response_headers,
          body: { error: { message: 'Synthetic request error', code: 100 } }.to_json
        )

      expect { service.fetch_health_status }.to raise_error(RuntimeError, /Synthetic request error/)
      expect(whatsapp_channel.authorization_error_count).to eq(0)
    end
  end
end
