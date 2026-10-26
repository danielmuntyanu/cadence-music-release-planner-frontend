<script setup>
import PageContainer from '@/components/PageContainer.vue'
import SettingsSection from '@/components/settings/SettingsSection.vue'
import ProfileForm from '@/components/settings/ProfileForm.vue'
import PasswordForm from '@/components/settings/PasswordForm.vue'
import DeleteAccount from '@/components/settings/DeleteAccount.vue'
import UploadAvatar from '@/components/settings/UploadAvatar.vue'
</script>

<template>
  <PageContainer size="md">
    <div class="md:pt-8">
      <h1 class="mb-1 text-2xl font-medium text-on-surface">Settings</h1>
      <p class="mb-6 text-on-surface-variant">Manage your profile and account.</p>

      <div class="flex flex-col gap-6">
        <SettingsSection title="Avatar" description="Shown next to your name across the app.">
          <UploadAvatar />
        </SettingsSection>

        <SettingsSection title="Profile" description="Your public details and sign-in email.">
          <ProfileForm />
        </SettingsSection>

        <SettingsSection title="Password" description="Use a strong password you don't use elsewhere.">
          <PasswordForm />
        </SettingsSection>

        <SettingsSection title="Danger zone" danger>
          <DeleteAccount />
        </SettingsSection>
      </div>
    </div>
  </PageContainer>
</template>