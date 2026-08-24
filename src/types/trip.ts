export type IsoDate = string
export type LocalTime = string

export interface TripMetadata {
  readonly name: string
  readonly timeZone: string
  readonly startDate: IsoDate
  readonly endDate: IsoDate
  readonly totalDays: number
}

export interface Stage {
  readonly stageOrder: number
  readonly city: string
  readonly japaneseName: string | null
  readonly startDate: IsoDate
  readonly endDate: IsoDate
  readonly nights: number | null
}

export interface Activity {
  readonly id: string
  readonly name: string
  readonly city: string | null
  readonly area: string | null
  readonly category: string | null
  readonly durationMin: number | null
  readonly weather: string | null
  readonly favorite: boolean
  readonly reservation: string | null
  readonly about: string | null
  readonly info: string | null
  readonly important: string | null
  readonly ourNotes: string | null
  readonly websiteLink: string | null
}

export interface Food {
  readonly id: string
  readonly name: string
  readonly city: string | null
  readonly area: string | null
  readonly category: string | null
  readonly foodType: string | null
  readonly favorite: boolean
  readonly reservation: string | null
  readonly price: string | null
  readonly about: string | null
  readonly info: string | null
  readonly important: string | null
  readonly ourNotes: string | null
  readonly websiteLink: string | null
}

export interface Transport {
  readonly id: string
  readonly stageOrder: number
  readonly date: IsoDate
  readonly startTime: LocalTime | null
  readonly endTime: LocalTime | null
  readonly mode: string | null
  readonly from: string | null
  readonly to: string | null
  readonly service: string | null
  readonly status: string | null
  readonly info: string | null
  readonly important: string | null
  readonly ourNotes: string | null
}

export interface Hotel {
  readonly stageOrder: number
  readonly name: string
  readonly checkinTime: LocalTime | null
  readonly checkoutTime: LocalTime | null
  readonly address: string | null
  readonly info: string | null
  readonly important: string | null
  readonly ourNotes: string | null
}

export type DiscoveryMetadata =
  | {
      readonly mode: 'activities'
      readonly city: string | null
      readonly area: string | null
    }
  | {
      readonly mode: 'food'
      readonly city: string | null
      readonly area: string | null
      readonly category: string | null
    }

export interface TimelineItem {
  readonly type: string
  readonly reference: string | null
  readonly title: string | null
  readonly city: string | null
  readonly area: string | null
  readonly startTime: LocalTime | null
  readonly endTime: LocalTime | null
  readonly durationMin: number | null
  readonly status: string | null
  readonly info: string | null
  readonly important: string | null
  readonly favorite?: boolean
  readonly reservation?: string | null
  readonly isMajorTransport?: boolean
  readonly mode?: string | null
  readonly from?: string | null
  readonly to?: string | null
  readonly service?: string | null
  readonly hotelStageOrder?: number
  readonly discovery?: DiscoveryMetadata
}

export interface TripDay {
  readonly date: IsoDate
  readonly dayNumber: number
  readonly stageOrder: number | null
  readonly city: string | null
  readonly japaneseName: string | null
  readonly timeline: readonly TimelineItem[]
}

export type Reminder = Readonly<Record<string, never>>

export interface TripData {
  readonly schemaVersion: 1
  readonly trip: TripMetadata
  readonly stages: readonly Stage[]
  readonly activities: Readonly<Record<string, Activity>>
  readonly food: Readonly<Record<string, Food>>
  readonly transports: Readonly<Record<string, Transport>>
  readonly hotels: Readonly<Record<string, Hotel>>
  readonly days: Readonly<Record<string, TripDay>>
  readonly reminders: readonly Reminder[]
}
