'use client'

import { Clock, Cpu, MessageSquare, Activity } from 'lucide-react'
import { useI18n } from '@/i18n/useI18n'

// Bu kart, AI düzenleme işlemi tamamlandığında gelen yanıtın özetini gösterir
// Kullanıcıya yapılan düzenlemenin prompt'u, güç seviyesi, süre ve model bilgilerini sunar
// Non-destructive çalışma prensibine uygun olarak yalnızca bilgilendirme amaçlıdır

export interface AiResponseMeta {
  prompt: string
  strength: number
  durationMs: number
  model: string
}

interface AiResponseCardProps {
  response: AiResponseMeta
}

export function AiResponseCard({ response }: AiResponseCardProps) {
  const { prompt, strength, durationMs, model } = response
  const { t } = useI18n()

  return (
    <div className="mt-4 rounded-xl p-4 bg-gradient-to-r from-emerald-50 to-sky-50 border border-emerald-200/60">
      {/* Başlık */}
      <div className="flex items-center mb-3">
        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mr-2">
          <Activity className="w-4 h-4" />
        </div>
        <h4 className="text-sm font-semibold text-emerald-800">{t('aiResponseCard.title')}</h4>
      </div>

      {/* İçerik */}
      <div className="space-y-2 text-sm">
        <div className="flex items-start">
          <MessageSquare className="w-4 h-4 text-emerald-700 mt-0.5 mr-2" />
          <div>
            <div className="text-emerald-900 font-medium">{t('aiResponseCard.prompt')}</div>
            <div className="text-emerald-800/90 break-words">{prompt || t('aiResponseCard.dash')}</div>
          </div>
        </div>

        <div className="flex items-center">
          <Cpu className="w-4 h-4 text-emerald-700 mr-2" />
          <div className="text-emerald-900">
            {t('aiResponseCard.strength')}: <span className="font-semibold">{strength.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex items-center">
          <Clock className="w-4 h-4 text-emerald-700 mr-2" />
          <div className="text-emerald-900">
            {t('aiResponseCard.duration')}: <span className="font-semibold">{t('aiResponseCard.ms', { value: String(Math.max(1, Math.round(durationMs))) })}</span>
          </div>
        </div>

        <div className="flex items-center">
          <Activity className="w-4 h-4 text-emerald-700 mr-2" />
          <div className="text-emerald-900">
            {t('aiResponseCard.model')}: <span className="font-semibold">{model}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
