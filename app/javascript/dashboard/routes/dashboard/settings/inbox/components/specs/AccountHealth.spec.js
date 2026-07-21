import { shallowMount } from '@vue/test-utils';
import AccountHealth from '../AccountHealth.vue';

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: key => key }),
}));

const authorizationError = {
  error: 'Synthetic authorization error',
  error_code: 'authorization_required',
};

const buildWrapper = props =>
  shallowMount(AccountHealth, {
    props: {
      healthError: authorizationError,
      ...props,
    },
    global: {
      stubs: {
        ButtonV4: {
          emits: ['click'],
          template: '<button @click="$emit(\'click\')"><slot /></button>',
        },
      },
    },
  });

describe('AccountHealth', () => {
  it('prompts embedded signup inboxes to reconfigure', () => {
    const wrapper = buildWrapper({ isEmbeddedSignup: true });

    expect(wrapper.text()).toContain(
      'INBOX_MGMT.ACCOUNT_HEALTH.AUTHORIZATION_ERROR.EMBEDDED_SIGNUP_DESCRIPTION'
    );
    expect(wrapper.text()).toContain(
      'INBOX_MGMT.ACCOUNT_HEALTH.AUTHORIZATION_ERROR.RECONFIGURE'
    );
  });

  it('prompts manually configured inboxes to update the token', () => {
    const wrapper = buildWrapper({ isEmbeddedSignup: false });

    expect(wrapper.text()).toContain(
      'INBOX_MGMT.ACCOUNT_HEALTH.AUTHORIZATION_ERROR.MANUAL_DESCRIPTION'
    );
    expect(wrapper.text()).toContain(
      'INBOX_MGMT.ACCOUNT_HEALTH.AUTHORIZATION_ERROR.UPDATE_TOKEN'
    );
  });

  it('opens the configuration page from the recovery action', async () => {
    const wrapper = buildWrapper({ isEmbeddedSignup: true });
    const recoveryButton = wrapper
      .findAll('button')
      .find(button =>
        button
          .text()
          .includes('INBOX_MGMT.ACCOUNT_HEALTH.AUTHORIZATION_ERROR.RECONFIGURE')
      );

    await recoveryButton.trigger('click');

    expect(wrapper.emitted('openConfiguration')).toHaveLength(1);
  });
});
