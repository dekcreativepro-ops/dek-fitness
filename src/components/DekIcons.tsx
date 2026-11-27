import type { ComponentType } from 'react';
import {
  AlertTriangle,
  Award,
  Music as LucideMusic,
  Flower2 as LucideFlower2,
  Hand as LucideHand,
  Volleyball as LucideVolleyball,
  Waves as LucideWaves,
  Heart as LucideHeart,
  Sunrise as LucideSunrise,
  Bell as LucideBell,
  Bike as LucideBike,
  Box,
  Calendar,
  CalendarCheck,
  Camera,
  CameraOff,
  Check,
  CheckCircle2,
  CircleDot,
  Clock,
  Compass as LucideCompass,
  Crown as LucideCrown,
  Droplets,
  Dumbbell as LucideDumbbell,
  Flag as LucideFlag,
  Flame,
  Footprints as LucideFootprints,
  Ghost as LucideGhost,
  Globe as LucideGlobe,
  Handshake as LucideHandshake,
  Home,
  Lock as LucideLock,
  LogOut,
  MapPin as LucideMapPin,
  Mic,
  MicOff,
  Minus as LucideMinus,
  Navigation,
  Paintbrush,
  Play as LucidePlay,
  PlayCircle as LucidePlayCircle,
  Plus as LucidePlus,
  QrCode as LucideQrCode,
  RotateCcw,
  Send,
  ShieldAlert,
  ShieldCheck as LucideShieldCheck,
  Shuffle as LucideShuffle,
  SlidersHorizontal as LucideSlidersHorizontal,
  Sparkles,
  Star as LucideStar,
  Swords,
  ThumbsUp,
  Timer as LucideTimer,
  Trophy as LucideTrophy,
  Users as LucideUsers,
  Utensils,
  Video,
  Volume2,
  VolumeX,
  Wallet as LucideWallet,
  X as LucideX,
  Zap,
  Activity,
  ArrowLeft as LucideArrowLeft,
  BatteryFull as LucideBatteryFull,
  Maximize2 as LucideMaximize,
  Minimize2 as LucideMinimize,
  Wifi as LucideWifi,
  ArrowRight as LucideArrowRight,
  ArrowUpRight as LucideArrowUpRight,
  Bookmark as LucideBookmark,
  ChevronLeft,
  ChevronRight,
  ListOrdered,
  Mars,
  Pause as LucidePause,
  Repeat,
  Ruler as LucideRuler,
  Scale as LucideScale,
  Search,
  SkipBack,
  SkipForward as LucideSkipForward,
  Target as LucideTarget,
  TrendingDown,
  TrendingUp,
  Venus,
  type LucideProps,
} from 'lucide-react';

export interface DekIconProps {
  className?: string;
  weight?: 'duotone' | 'bold' | 'regular';
}

/** Icônes en style ligne uniquement : trait 1.75 (2.25 en `bold`), jamais de remplissage. */
function makeLine(IconComp: ComponentType<LucideProps>) {
  return function DekIcon({ className, weight = 'regular' }: DekIconProps) {
    return <IconComp className={className} strokeWidth={weight === 'bold' ? 2.25 : 1.75} fill="none" />;
  };
}

export const ArrowsClockwise = makeLine(RotateCcw);
export const BowlFood = makeLine(Utensils);
export const CalendarIcon = makeLine(Calendar);
export { CalendarIcon as Calendar };
export const CalendarCheckIcon = makeLine(CalendarCheck);
export { CalendarCheckIcon as CalendarCheck };
export const CameraIcon = makeLine(Camera);
export { CameraIcon as Camera };
export const CameraSlash = makeLine(CameraOff);
export const CheckIcon = makeLine(Check);
export { CheckIcon as Check };
export const CheckCircle = makeLine(CheckCircle2);
export const ClockIcon = makeLine(Clock);
export { ClockIcon as Clock };
export const Compass = makeLine(LucideCompass);
export const Cube = makeLine(Box);
export const Drop = makeLine(Droplets);
export const Fire = makeLine(Flame);
export const Globe = makeLine(LucideGlobe);
export const HandsClapping = makeLine(ThumbsUp);
export const House = makeLine(Home);
export const Lightning = makeLine(Zap);
export const Lock = makeLine(LucideLock);
export const MapPin = makeLine(LucideMapPin);
export const Medal = makeLine(Award);
export const Microphone = makeLine(Mic);
export const MicrophoneSlash = makeLine(MicOff);
export const Minus = makeLine(LucideMinus);
export const NavigationArrow = makeLine(Navigation);
export const PaintBrush = makeLine(Paintbrush);
export const PaperPlaneRight = makeLine(Send);
export const Play = makeLine(LucidePlay);
export const PlayCircle = makeLine(LucidePlayCircle);
export const Plus = makeLine(LucidePlus);
export const ShieldCheck = makeLine(LucideShieldCheck);
export const ShieldWarning = makeLine(ShieldAlert);
export const Shuffle = makeLine(LucideShuffle);
export const SignOut = makeLine(LogOut);
export const SlidersHorizontal = makeLine(LucideSlidersHorizontal);
export const SoccerBall = makeLine(CircleDot);
export const Sparkle = makeLine(Sparkles);
export const Star = makeLine(LucideStar);
export const Sword = makeLine(Swords);
export const Trophy = makeLine(LucideTrophy);
export const Users = makeLine(LucideUsers);
export const UsersThree = makeLine(LucideUsers);
export const VideoCamera = makeLine(Video);
export const Warning = makeLine(AlertTriangle);
export const X = makeLine(LucideX);
export const QrCode = makeLine(LucideQrCode);
export const Timer = makeLine(LucideTimer);
export const Dumbbell = makeLine(LucideDumbbell);
export const Flag = makeLine(LucideFlag);
export const Ghost = makeLine(LucideGhost);
export const Handshake = makeLine(LucideHandshake);
export const Bell = makeLine(LucideBell);
export const Bike = makeLine(LucideBike);
export const Footprints = makeLine(LucideFootprints);
export const Wallet = makeLine(LucideWallet);
export const Crown = makeLine(LucideCrown);
export const SpeakerHigh = makeLine(Volume2);
export const SpeakerSlash = makeLine(VolumeX);
export const CaretLeft = makeLine(ChevronLeft);
export const CaretRight = makeLine(ChevronRight);
export const BookmarkSimple = makeLine(LucideBookmark);
export const MagnifyingGlass = makeLine(Search);
export const Pause = makeLine(LucidePause);
export const SkipForward = makeLine(LucideSkipForward);
export const SkipBackward = makeLine(SkipBack);
export const ArrowRight = makeLine(LucideArrowRight);
export const GenderMale = makeLine(Mars);
export const GenderFemale = makeLine(Venus);
export const TrendUp = makeLine(TrendingUp);
export const TrendDown = makeLine(TrendingDown);
export const Target = makeLine(LucideTarget);
export const RulerIcon = makeLine(LucideRuler);
export const ScaleIcon = makeLine(LucideScale);
export const ListNumbers = makeLine(ListOrdered);
export const Pulse = makeLine(Activity);
export const Rounds = makeLine(Repeat);
export const ArrowLeft = makeLine(LucideArrowLeft);
export const ArrowUpRight = makeLine(LucideArrowUpRight);
export const Funnel = makeLine(LucideSlidersHorizontal);
export const BatteryFull = makeLine(LucideBatteryFull);
export const Maximize = makeLine(LucideMaximize);
export const Minimize = makeLine(LucideMinimize);
export const Wifi = makeLine(LucideWifi);
export const Heart = makeLine(LucideHeart);
export const Music = makeLine(LucideMusic);
export const Volley = makeLine(LucideVolleyball);
export const Swim = makeLine(LucideWaves);
export const Yoga = makeLine(LucideFlower2);
export const HandBall = makeLine(LucideHand);
export const Sunrise = makeLine(LucideSunrise);
