import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palette, spacing } from '@/theme';

const EFFECTIVE_DATE = '1 July 2026';
const CONTACT_EMAIL = 'hello@cyclealign.app';

type Section = { title: string; body: string };

const SECTIONS: Section[] = [
  {
    title: '1. Acceptance of Terms',
    body: `By downloading, installing or using CycleAlign ("the App"), you agree to be bound by these Terms of Service. If you do not agree, do not use the App. We may update these terms from time to time; continued use after an update constitutes acceptance of the revised terms.`,
  },
  {
    title: '2. Description of Service',
    body: `CycleAlign is a hormonal intelligence platform that uses cycle data you provide to generate personalised productivity and wellness guidance. The App operates in two modes: a fully offline demo mode and a cloud-synced account mode backed by Supabase. Features vary by subscription tier (Free or Premium).`,
  },
  {
    title: '3. Eligibility',
    body: `You must be at least 13 years old to use CycleAlign. By using the App you confirm that you meet this requirement. The App is designed for individuals who experience menstrual cycles and wish to align their work and daily activities with hormonal patterns.`,
  },
  {
    title: '4. User Account',
    body: `You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately at ${CONTACT_EMAIL} if you suspect any unauthorised access. We are not liable for loss or damage arising from your failure to protect your credentials.`,
  },
  {
    title: '5. Privacy & Data',
    body: `Your cycle and health data is processed primarily on your device. If you create an account, certain data is synced to our secure servers (Supabase) solely to provide the service. We do not sell, rent or share your personal data with third parties for marketing purposes. You can delete all your data at any time from Privacy Settings → Delete all my data. Full details are in our Privacy Policy.`,
  },
  {
    title: '6. Subscription & Billing',
    body: `CycleAlign offers a Free tier and a Premium tier. Premium access is available at ₹299/month or ₹2,999/year. Payment is processed by Razorpay. Your subscription auto-renews unless cancelled at least 24 hours before the renewal date. Refunds are available within 7 days of purchase if you have not used any premium features. To cancel, contact ${CONTACT_EMAIL}.`,
  },
  {
    title: '7. Health Disclaimer',
    body: `CycleAlign provides general wellness and productivity guidance based on hormonal cycle patterns. It is not a medical device and does not provide medical advice, diagnoses or treatment. It is not a contraceptive tool and must not be used as one. Always consult a qualified healthcare professional for any medical concerns, symptoms or reproductive health questions. We expressly disclaim any liability for decisions made based on content in the App.`,
  },
  {
    title: '8. Acceptable Use',
    body: `You agree not to: (a) reverse-engineer, decompile or attempt to extract source code from the App; (b) use the App for any unlawful purpose; (c) attempt to gain unauthorised access to any part of our systems; (d) submit false or misleading information; or (e) resell or commercially exploit the service without our written consent.`,
  },
  {
    title: '9. Intellectual Property',
    body: `All content, design, trademarks and technology within CycleAlign are the exclusive property of CycleAlign and its licensors. You are granted a limited, non-exclusive, non-transferable licence to use the App for personal, non-commercial purposes. Nothing in these terms transfers any intellectual property rights to you.`,
  },
  {
    title: '10. Limitation of Liability',
    body: `To the maximum extent permitted by applicable law, CycleAlign and its founders, officers, employees and partners shall not be liable for any indirect, incidental, special, consequential or punitive damages arising from your use of the App, even if we have been advised of the possibility of such damages. Our total liability to you for any claim shall not exceed the amount you paid us in the 12 months preceding the claim.`,
  },
  {
    title: '11. Termination',
    body: `We reserve the right to suspend or terminate your account if we reasonably believe you have violated these terms. You may delete your account at any time from within the App. On termination, your licence to use the App ends immediately and we will delete your data in accordance with our Privacy Policy.`,
  },
  {
    title: '12. Governing Law',
    body: `These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts located in Mumbai, Maharashtra, India. If you are a consumer resident in another country, you may also have rights under the laws of your country of residence.`,
  },
  {
    title: '13. Contact',
    body: `For questions about these Terms, please contact us at:\n\nEmail: ${CONTACT_EMAIL}\nCycleAlign, Mumbai, India`,
  },
];

export default function Terms() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <Text style={styles.backChevron}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.effectiveDate}>Effective date: {EFFECTIVE_DATE}</Text>
        <Text style={styles.intro}>
          Please read these Terms of Service carefully before using CycleAlign. They govern
          your access to and use of our app and services.
        </Text>

        {SECTIONS.map((s) => (
          <View key={s.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{s.title}</Text>
            <Text style={styles.sectionBody}>{s.body}</Text>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2026 CycleAlign. Hormone intelligence for women who lead.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backChevron: { fontSize: 28, color: palette.ink, marginTop: -2 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: palette.ink },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 60,
    gap: 4,
  },
  effectiveDate: {
    fontSize: 12,
    color: palette.muted,
    marginBottom: 4,
  },
  intro: {
    fontSize: 14,
    lineHeight: 22,
    color: palette.inkSoft,
    marginBottom: spacing.lg,
    backgroundColor: palette.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: palette.line,
  },
  section: { marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: palette.ink,
    marginBottom: 6,
  },
  sectionBody: {
    fontSize: 14,
    lineHeight: 22,
    color: palette.inkSoft,
  },
  footer: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: palette.line,
    alignItems: 'center',
  },
  footerText: { fontSize: 12, color: palette.muted, textAlign: 'center' },
});
