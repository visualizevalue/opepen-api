import Renderer from './Renderer'
import SetSubmission from 'App/Models/SetSubmission'

export default class SetOptStatusRenderer extends Renderer {
  public static async render ({ submission, }: { submission: SetSubmission, }) {
    const c = (edition: number) => `rgba(58, 181, 0, ${submission.submissionStats.demand[edition] / edition})`

    const svg = `<svg width="1000" height="1000" viewBox="0 0 1000 1000" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="1000" height="1000" fill="black"/>
      <!-- 1/1 -->
      <rect fill="${c(1)}" x="750" y="750" width="50" height="50" transform="rotate(180 750 750)" stroke="white" stroke-width="6"/>
      <!-- 1/4 -->
      <rect fill="${c(4)}" x="750" y="700" width="50" height="200" transform="rotate(180 750 700)" stroke="white" stroke-width="6"/>
      <!-- 1/5 -->
      <rect fill="${c(5)}" x="700" y="750" width="50" height="250" transform="rotate(180 700 750)" stroke="white" stroke-width="6"/>
      <!-- 1/10 -->
      <rect fill="${c(10)}" x="650" y="750" width="150" height="250" transform="rotate(180 650 750)" stroke="white" stroke-width="6"/>
      <!-- 1/20 -->
      <rect fill="${c(20)}" width="250" height="250" transform="matrix(1 0 0 -1 250 750)" stroke="white" stroke-width="6"/>
      <!-- 1/40 -->
      <rect fill="${c(40)}" x="250" y="250" width="500" height="250" stroke="white" stroke-width="6"/>
    </svg>
    `

    return await this.png(svg)
  }
}
